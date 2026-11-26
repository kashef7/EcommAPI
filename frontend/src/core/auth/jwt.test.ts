import { describe, expect, it } from 'vitest';
import { decodeJwtClaims, isAdminFromToken } from './jwt';

function encodeSegment(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeFakeJwt(payload: Record<string, unknown>): string {
  return `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(payload)}.sig`;
}

describe('JWT decoding and admin detection', () => {
  it('detects Admin from short role claim as string or array', () => {
    expect(isAdminFromToken(makeFakeJwt({ role: 'Admin', sub: '1' }))).toBe(true);
    expect(isAdminFromToken(makeFakeJwt({ role: ['Customer', 'Admin'] }))).toBe(true);
    expect(isAdminFromToken(makeFakeJwt({ role: 'Customer' }))).toBe(false);
  });

  it('detects Admin from Microsoft URI role claim as string or array', () => {
    const msClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    expect(isAdminFromToken(makeFakeJwt({ [msClaim]: 'Admin', email: 'a@b.com' }))).toBe(true);
    expect(isAdminFromToken(makeFakeJwt({ [msClaim]: ['Member', 'Admin'] }))).toBe(true);
    expect(isAdminFromToken(makeFakeJwt({ [msClaim]: ['Member'] }))).toBe(false);
  });

  it('returns non-admin safely for malformed tokens without throwing', () => {
    expect(decodeJwtClaims('not-a-jwt')).toEqual({
      sub: null,
      email: null,
      exp: null,
      isAdmin: false,
    });
    expect(decodeJwtClaims('a.!!!.c').isAdmin).toBe(false);
    expect(decodeJwtClaims(null).isAdmin).toBe(false);
    expect(decodeJwtClaims('').isAdmin).toBe(false);
  });
});
