export interface DecodedJwtClaims {
  readonly sub: string | null;
  readonly email: string | null;
  readonly exp: number | null;
  readonly isAdmin: boolean;
}

const SHORT_ROLE_CLAIM = 'role';
const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const ADMIN_ROLE_VALUE = 'Admin';

function decodeBase64Url(segment: string): string | null {
  if (!segment) return null;
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (normalized.length % 4)) % 4;
  const padded = normalized.padEnd(normalized.length + paddingNeeded, '=');

  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function hasAdminRole(roleClaim: unknown): boolean {
  if (typeof roleClaim === 'string') {
    return roleClaim === ADMIN_ROLE_VALUE;
  }
  if (Array.isArray(roleClaim)) {
    return roleClaim.some((item) => item === ADMIN_ROLE_VALUE);
  }
  return false;
}

export function decodeJwtClaims(token: string | null | undefined): DecodedJwtClaims {
  const empty: DecodedJwtClaims = { sub: null, email: null, exp: null, isAdmin: false };
  if (!token || typeof token !== 'string') {
    return empty;
  }

  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return empty;
  }

  const json = decodeBase64Url(parts[1]);
  if (!json) {
    return empty;
  }

  try {
    const payload: unknown = JSON.parse(json);
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return empty;
    }
    const record = payload as Record<string, unknown>;
    const sub = typeof record['sub'] === 'string' ? record['sub'] : null;
    const email = typeof record['email'] === 'string' ? record['email'] : null;
    const exp = typeof record['exp'] === 'number' ? record['exp'] : null;
    const isAdmin = hasAdminRole(record[SHORT_ROLE_CLAIM]) || hasAdminRole(record[MS_ROLE_CLAIM]);

    return { sub, email, exp, isAdmin };
  } catch {
    return empty;
  }
}

export function isAdminFromToken(token: string | null | undefined): boolean {
  return decodeJwtClaims(token).isAdmin;
}
