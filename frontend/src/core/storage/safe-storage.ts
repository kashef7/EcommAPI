// Only two localStorage keys are permitted across Royal Market:
// 1. rm.hasSession (non-sensitive cookie-refresh hint)
// 2. rm.theme (user light/dark theme preference)
const HAS_SESSION_HINT_KEY = 'rm.hasSession';
export const THEME_STORAGE_KEY = 'rm.theme';
const SESSION_STORAGE_KEY = 'rm.session';
const FLASH_TOAST_KEY = 'rm.flashToast';

export type StoredTheme = 'light' | 'dark';

export function readSessionStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSessionStorage(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in restricted browsing modes.
  }
}

export function removeSessionStorage(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors on cleanup.
  }
}

export function readStoredSessionRaw(): string | null {
  return readSessionStorage(SESSION_STORAGE_KEY);
}

export function writeStoredSessionRaw(serialized: string): void {
  writeSessionStorage(SESSION_STORAGE_KEY, serialized);
}

export function clearStoredSessionRaw(): void {
  removeSessionStorage(SESSION_STORAGE_KEY);
}

export function readHasSessionHint(): boolean {
  try {
    return window.localStorage.getItem(HAS_SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeHasSessionHint(): void {
  try {
    window.localStorage.setItem(HAS_SESSION_HINT_KEY, '1');
  } catch {
    // Ignore storage errors if localStorage is blocked.
  }
}

export function clearHasSessionHint(): void {
  try {
    window.localStorage.removeItem(HAS_SESSION_HINT_KEY);
  } catch {
    // Ignore storage errors on cleanup.
  }
}

export function readStoredTheme(): StoredTheme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: StoredTheme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors if localStorage is blocked.
  }
}

export function clearStoredTheme(): void {
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Ignore storage errors on cleanup.
  }
}

export interface FlashToastPayload {
  readonly variant: 'success' | 'error' | 'info' | 'warning';
  readonly message: string;
}

export function setFlashToast(payload: FlashToastPayload): void {
  writeSessionStorage(FLASH_TOAST_KEY, JSON.stringify(payload));
}

export function consumeFlashToast(): FlashToastPayload | null {
  const raw = readSessionStorage(FLASH_TOAST_KEY);
  if (!raw) return null;
  removeSessionStorage(FLASH_TOAST_KEY);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'variant' in parsed &&
      'message' in parsed &&
      typeof parsed.message === 'string' &&
      (parsed.variant === 'success' ||
        parsed.variant === 'error' ||
        parsed.variant === 'info' ||
        parsed.variant === 'warning')
    ) {
      return { variant: parsed.variant, message: parsed.message };
    }
    return null;
  } catch {
    return null;
  }
}
