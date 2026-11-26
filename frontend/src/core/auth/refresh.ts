import { apiRequest, apiVoidRequest, configureHttpAuth } from '@/core/http/client';
import { routes } from '@/core/navigation/routes';
import { logger } from '@/core/logging/logger';
import { broadcastAuthEvent, subscribeAuthEvents } from './auth-channel';
import {
  clearAuthSession,
  getAccessToken,
  hasSessionHint,
  hydrateSessionFromStorage,
  isAccessTokenExpiring,
  isTokenValidFor,
  readStoredSession,
  setAuthenticatedSession,
} from './session';

interface RawRefreshPayload {
  readonly name?: string;
  readonly email?: string;
  readonly accessToken?: string;
  readonly accessExpiresIn?: number;
}

const REFRESH_LOCK_NAME = 'rm-refresh';

let inFlightRefresh: Promise<string | null> | null = null;
let bootstrapPromise: Promise<void> | null = null;
let authConfigured = false;
let syncSubscribed = false;

async function runWithCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  if (
    typeof navigator !== 'undefined' &&
    'locks' in navigator &&
    navigator.locks &&
    typeof navigator.locks.request === 'function'
  ) {
    return navigator.locks.request(REFRESH_LOCK_NAME, fn);
  }
  return fn();
}

function stripAndSaveRefreshResponse(raw: unknown): string | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const accessToken = typeof obj['accessToken'] === 'string' ? obj['accessToken'] : null;
  const accessExpiresIn =
    typeof obj['accessExpiresIn'] === 'number' && Number.isFinite(obj['accessExpiresIn'])
      ? obj['accessExpiresIn']
      : null;

  if (!accessToken || accessExpiresIn === null) {
    return null;
  }

  const sanitized: RawRefreshPayload = {
    ...(typeof obj['name'] === 'string' ? { name: obj['name'] } : {}),
    ...(typeof obj['email'] === 'string' ? { email: obj['email'] } : {}),
    accessToken,
    accessExpiresIn,
  };

  setAuthenticatedSession({
    accessToken: sanitized.accessToken as string,
    accessExpiresIn: sanitized.accessExpiresIn as number,
    ...(sanitized.name !== undefined ? { name: sanitized.name } : {}),
    ...(sanitized.email !== undefined ? { email: sanitized.email } : {}),
  });

  return accessToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = runWithCrossTabLock(async () => {
    try {
      const response = await apiRequest<unknown>('/auth/refreshToken', {
        method: 'POST',
        auth: 'none',
        credentials: 'include',
      });
      const token = stripAndSaveRefreshResponse(response);
      if (!token) {
        clearAuthSession();
        return null;
      }
      return token;
    } catch {
      clearAuthSession();
      return null;
    }
  }).finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

export function ensureHttpAuthConfigured(): void {
  if (authConfigured) {
    return;
  }
  authConfigured = true;
  configureHttpAuth({
    getAccessToken,
    isAccessTokenExpiring,
    refreshAccessToken,
    handleAuthExpired: () => {
      clearAuthSession();
      broadcastAuthEvent('logout');
    },
  });
}

export async function bootstrapSession(): Promise<void> {
  ensureHttpAuthConfigured();
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const stored = readStoredSession();
    if (stored && isTokenValidFor(stored.expiresAt)) {
      hydrateSessionFromStorage(stored);
      return;
    }

    if (hasSessionHint()) {
      await refreshAccessToken();
      return;
    }

    clearAuthSession();
  })().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
}

export function initAuthSync(): () => void {
  if (syncSubscribed) {
    return () => undefined;
  }
  syncSubscribed = true;

  return subscribeAuthEvents((event) => {
    logger.debug('Received cross-tab auth event', { event });
    if (event === 'logout') {
      clearAuthSession();
      return;
    }
    void bootstrapSession();
  });
}

export interface LogoutOptions {
  readonly redirectTo?: string | null;
}

export async function logoutSession(options: LogoutOptions = {}): Promise<void> {
  ensureHttpAuthConfigured();
  const redirectTarget = options.redirectTo === undefined ? routes.home() : options.redirectTo;

  try {
    let token = getAccessToken();
    if ((!token || isAccessTokenExpiring()) && hasSessionHint()) {
      token = await refreshAccessToken();
    }

    if (token) {
      await apiVoidRequest('/auth/logout', {
        method: 'POST',
        auth: 'none',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    logger.warn('Logout request did not succeed cleanly; clearing local session anyway', {
      error,
    });
  } finally {
    clearAuthSession();
    broadcastAuthEvent('logout');
    if (redirectTarget && typeof window !== 'undefined') {
      window.location.assign(redirectTarget);
    }
  }
}

export function resetAuthCoordinationForTests(): void {
  inFlightRefresh = null;
  bootstrapPromise = null;
  authConfigured = false;
}
