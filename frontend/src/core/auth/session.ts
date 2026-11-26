import { signal } from '@preact/signals';
import {
  clearHasSessionHint,
  clearStoredSessionRaw,
  readHasSessionHint,
  readStoredSessionRaw,
  writeHasSessionHint,
  writeStoredSessionRaw,
} from '@/core/storage/safe-storage';
import { decodeJwtClaims } from './jwt';

export const TOKEN_EXPIRY_BUFFER_MS = 30_000;

export interface StoredSession {
  readonly accessToken: string;
  readonly expiresAt: number;
}

export type SessionState =
  | { readonly status: 'unknown' }
  | { readonly status: 'anonymous' }
  | {
      readonly status: 'authenticated';
      readonly accessToken: string;
      readonly expiresAt: number;
      readonly isAdmin: boolean;
      readonly name: string | null;
      readonly email: string | null;
    };

export const sessionState = signal<SessionState>({ status: 'unknown' });

export function readStoredSession(): StoredSession | null {
  const raw = readStoredSessionRaw();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'accessToken' in parsed &&
      'expiresAt' in parsed &&
      typeof parsed.accessToken === 'string' &&
      parsed.accessToken.length > 0 &&
      typeof parsed.expiresAt === 'number' &&
      Number.isFinite(parsed.expiresAt)
    ) {
      return {
        accessToken: parsed.accessToken,
        expiresAt: parsed.expiresAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function isTokenValidFor(
  expiresAt: number,
  bufferMs: number = TOKEN_EXPIRY_BUFFER_MS,
): boolean {
  return expiresAt - Date.now() > bufferMs;
}

export interface SaveSessionInput {
  readonly accessToken: string;
  readonly accessExpiresIn: number;
  readonly name?: string | null;
  readonly email?: string | null;
}

export function setAuthenticatedSession(input: SaveSessionInput): StoredSession {
  const expiresAt = Date.now() + input.accessExpiresIn * 1000;
  const stored: StoredSession = {
    accessToken: input.accessToken,
    expiresAt,
  };
  writeStoredSessionRaw(JSON.stringify(stored));
  writeHasSessionHint();

  const claims = decodeJwtClaims(input.accessToken);
  const current = sessionState.value;
  const prevName = current.status === 'authenticated' ? current.name : null;

  sessionState.value = {
    status: 'authenticated',
    accessToken: input.accessToken,
    expiresAt,
    isAdmin: claims.isAdmin,
    name: input.name !== undefined ? input.name : prevName,
    email: input.email !== undefined ? input.email : claims.email,
  };

  return stored;
}

export function hydrateSessionFromStorage(stored: StoredSession): void {
  const claims = decodeJwtClaims(stored.accessToken);
  const current = sessionState.value;
  const prevName = current.status === 'authenticated' ? current.name : null;
  sessionState.value = {
    status: 'authenticated',
    accessToken: stored.accessToken,
    expiresAt: stored.expiresAt,
    isAdmin: claims.isAdmin,
    name: prevName,
    email: claims.email,
  };
}

export function updateSessionProfile(profile: {
  readonly name: string;
  readonly email: string;
}): void {
  const current = sessionState.value;
  if (current.status === 'authenticated') {
    sessionState.value = {
      ...current,
      name: profile.name,
      email: profile.email,
    };
  }
}

export function clearAuthSession(): void {
  clearStoredSessionRaw();
  clearHasSessionHint();
  sessionState.value = { status: 'anonymous' };
}

export function hasSessionHint(): boolean {
  return readHasSessionHint();
}

export function getAccessToken(): string | null {
  const current = sessionState.value;
  if (current.status === 'authenticated') {
    return current.accessToken;
  }
  return readStoredSession()?.accessToken ?? null;
}

export function isAccessTokenExpiring(): boolean {
  const current = sessionState.value;
  if (current.status === 'authenticated') {
    return !isTokenValidFor(current.expiresAt);
  }
  const stored = readStoredSession();
  return stored ? !isTokenValidFor(stored.expiresAt) : true;
}
