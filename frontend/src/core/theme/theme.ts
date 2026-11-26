import { computed, signal } from '@preact/signals';
import { readStoredTheme, THEME_STORAGE_KEY, writeStoredTheme } from '@/core/storage/safe-storage';

export type Theme = 'light' | 'dark';

export const THEME_CHROME_COLORS: Readonly<Record<Theme, string>> = {
  light: '#194350',
  dark: '#194350',
};

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function resolveSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function resolveInitialTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) {
    return stored;
  }
  if (typeof document !== 'undefined') {
    const fromAttr = document.documentElement.dataset.theme;
    if (fromAttr === 'light' || fromAttr === 'dark') {
      return fromAttr;
    }
  }
  return resolveSystemTheme();
}

export function applyThemeToDocument(next: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset.theme = next;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', THEME_CHROME_COLORS[next]);
  }
}

export const theme = signal<Theme>(resolveInitialTheme());
export const isDarkMode = computed<boolean>(() => theme.value === 'dark');

export function setTheme(next: Theme): void {
  writeStoredTheme(next);
  theme.value = next;
  applyThemeToDocument(next);
}

export function toggleTheme(): void {
  setTheme(theme.value === 'dark' ? 'light' : 'dark');
}

export function initThemeSync(): () => void {
  const initial = resolveInitialTheme();
  theme.value = initial;
  applyThemeToDocument(initial);

  if (typeof window === 'undefined') {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) {
      return;
    }
    const next =
      event.newValue === 'light' || event.newValue === 'dark'
        ? event.newValue
        : (readStoredTheme() ?? resolveSystemTheme());
    theme.value = next;
    applyThemeToDocument(next);
  }

  window.addEventListener('storage', handleStorage);

  const mediaQuery =
    typeof window.matchMedia === 'function' ? window.matchMedia(DARK_MEDIA_QUERY) : null;

  function handleMediaChange(event: MediaQueryListEvent) {
    if (readStoredTheme() !== null) {
      return;
    }
    const next: Theme = event.matches ? 'dark' : 'light';
    theme.value = next;
    applyThemeToDocument(next);
  }

  if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleMediaChange);
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleMediaChange);
    }
  };
}

export function syncThemeFromEnvironmentForTests(): void {
  const next = resolveInitialTheme();
  theme.value = next;
  applyThemeToDocument(next);
}
