import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY } from '@/core/storage/safe-storage';
import {
  initThemeSync,
  isDarkMode,
  setTheme,
  syncThemeFromEnvironmentForTests,
  THEME_CHROME_COLORS,
  theme,
  toggleTheme,
} from './theme';

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((type: string, cb: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.add(cb);
    }),
    removeEventListener: vi.fn((type: string, cb: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.delete(cb);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQueryList),
  );

  return {
    emitChange(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
}

let themeMeta: HTMLMetaElement;
let cleanupSync: (() => void) | undefined;

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.head.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove());
  themeMeta = document.createElement('meta');
  themeMeta.name = 'theme-color';
  themeMeta.content = THEME_CHROME_COLORS.light;
  document.head.appendChild(themeMeta);
});

afterEach(() => {
  cleanupSync?.();
  cleanupSync = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  themeMeta.remove();
});

describe('theme state and sync', () => {
  it('defaults to prefers-color-scheme when rm.theme is unset', () => {
    mockMatchMedia(true);
    syncThemeFromEnvironmentForTests();

    expect(theme.value).toBe('dark');
    expect(isDarkMode.value).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(themeMeta.getAttribute('content')).toBe(THEME_CHROME_COLORS.dark);
  });

  it('prefers stored rm.theme over OS preference and ignores malformed values', () => {
    mockMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    syncThemeFromEnvironmentForTests();

    expect(theme.value).toBe('light');
    expect(isDarkMode.value).toBe(false);

    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    delete document.documentElement.dataset.theme;
    syncThemeFromEnvironmentForTests();
    expect(theme.value).toBe('dark');
  });

  it('persists rm.theme, updates data-theme, and syncs theme-color meta on setTheme and toggleTheme', () => {
    mockMatchMedia(false);
    syncThemeFromEnvironmentForTests();
    expect(theme.value).toBe('light');

    toggleTheme();
    expect(theme.value).toBe('dark');
    expect(isDarkMode.value).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(themeMeta.getAttribute('content')).toBe(THEME_CHROME_COLORS.dark);

    setTheme('light');
    expect(theme.value).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(themeMeta.getAttribute('content')).toBe(THEME_CHROME_COLORS.light);
  });

  it('syncs theme across tabs via storage event and tracks system changes only when unset', () => {
    const media = mockMatchMedia(false);
    cleanupSync = initThemeSync();
    expect(theme.value).toBe('light');

    // System preference updates theme while rm.theme is unset
    media.emitChange(true);
    expect(theme.value).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    // Explicit preference locks out system preference changes
    setTheme('light');
    media.emitChange(true);
    expect(theme.value).toBe('light');

    // Cross-tab storage event updates theme immediately
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'dark',
      }),
    );
    expect(theme.value).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(themeMeta.getAttribute('content')).toBe(THEME_CHROME_COLORS.dark);
  });

  it('handles localStorage throwing in restricted browsing modes without crashing', () => {
    mockMatchMedia(true);
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    expect(() => {
      cleanupSync = initThemeSync();
      expect(theme.value).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
      toggleTheme();
      expect(theme.value).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
      expect(themeMeta.getAttribute('content')).toBe(THEME_CHROME_COLORS.light);
    }).not.toThrow();

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
  });
});
