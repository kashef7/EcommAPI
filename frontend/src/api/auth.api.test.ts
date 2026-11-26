import { afterEach, describe, expect, it, vi } from 'vitest';
import { login, refreshToken, signUp } from './auth.api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('auth.api token stripping', () => {
  it('strips refreshToken and refreshTokenExpiresAt from login, signUp, and refreshToken', async () => {
    const rawBody = {
      name: 'Ada',
      email: 'ada@example.com',
      accessToken: 'access-1',
      accessExpiresIn: 900,
      refreshToken: 'secret-raw-token',
      refreshTokenExpiresAt: '2027-01-01T00:00:00Z',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(() => Promise.resolve(jsonResponse(rawBody))),
    );

    const loginRes = await login({ email: 'ada@example.com', password: 'password123' });
    const signupRes = await signUp({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
    });
    const refreshRes = await refreshToken();

    for (const res of [loginRes, signupRes, refreshRes]) {
      expect(res).toEqual({
        name: 'Ada',
        email: 'ada@example.com',
        accessToken: 'access-1',
        accessExpiresIn: 900,
      });
      expect('refreshToken' in res).toBe(false);
      expect('refreshTokenExpiresAt' in res).toBe(false);
    }
  });
});
