import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureHttpAuthConfigured,
  logoutSession,
  resetAuthCoordinationForTests,
} from '@/core/auth/refresh';
import { clearAuthSession, sessionState, setAuthenticatedSession } from '@/core/auth/session';
import { readHasSessionHint, readStoredSessionRaw } from '@/core/storage/safe-storage';
import { ApiError } from './api-error';
import { apiRequest, apiVoidRequest, buildApiUrl, configureHttpAuth } from './client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HTTP client, auth refresh, and logout', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearAuthSession();
    resetAuthCoordinationForTests();
    configureHttpAuth(null);
    ensureHttpAuthConfigured();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('attaches bearer token, handles 204 and empty 401/403 bodies without JSON errors', async () => {
    setAuthenticatedSession({
      accessToken: 'token-valid',
      accessExpiresIn: 900,
      name: 'Ada',
      email: 'ada@example.com',
    });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response('', { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);

    const res1 = await apiVoidRequest('/cart', { method: 'DELETE', auth: 'required' });
    expect(res1).toBeUndefined();
    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(firstHeaders['Authorization']).toBe('Bearer token-valid');

    await expect(
      apiRequest('/categories', { method: 'POST', auth: 'required' }),
    ).rejects.toMatchObject({
      status: 403,
      kind: 'http',
    });
  });

  it('times out requests cleanly with ApiError kind=timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((_url, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }),
    );

    vi.useFakeTimers();
    const pending = apiRequest('/products', { timeoutMs: 200, auth: 'none' }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(250);
    const err = await pending;
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).kind).toBe('timeout');
  });

  it('refreshes once on 401, retries once, and does not loop on second 401', async () => {
    setAuthenticatedSession({
      accessToken: 'stale-token',
      accessExpiresIn: 900,
      name: 'Ada',
      email: 'ada@example.com',
    });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({
          name: 'Ada',
          email: 'ada@example.com',
          accessToken: 'fresh-token',
          accessExpiresIn: 900,
          refreshToken: 'must-be-stripped',
          refreshTokenExpiresAt: '2027-01-01T00:00:00Z',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    vi.stubGlobal('fetch', fetchMock);

    const data = await apiRequest<{ ok: boolean }>('/users/me', { auth: 'required' });
    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sessionState.value.status).toBe('authenticated');

    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({
          name: 'Ada',
          email: 'ada@example.com',
          accessToken: 'fresh-token-2',
          accessExpiresIn: 900,
        }),
      )
      .mockResolvedValueOnce(new Response('', { status: 401 }));

    await expect(apiRequest('/users/me', { auth: 'required' })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sessionState.value.status).toBe('anonymous');
  });

  it('uses single-flight refresh when multiple concurrent requests receive 401', async () => {
    setAuthenticatedSession({
      accessToken: 'stale-token',
      accessExpiresIn: 900,
    });

    let refreshCount = 0;
    const fetchMock = vi.fn<typeof fetch>((input, init) => {
      const url = String(input);
      if (url.endsWith('/auth/refreshToken')) {
        refreshCount += 1;
        return Promise.resolve(
          jsonResponse({
            name: 'Ada',
            email: 'ada@example.com',
            accessToken: 'single-flight-token',
            accessExpiresIn: 900,
          }),
        );
      }
      const headers = (init?.headers ?? {}) as Record<string, string>;
      if (headers['Authorization'] === 'Bearer stale-token') {
        return Promise.resolve(new Response('', { status: 401 }));
      }
      return Promise.resolve(jsonResponse({ ok: url }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b, c] = await Promise.all([
      apiRequest<{ ok: string }>('/users/me', { auth: 'required' }),
      apiRequest<{ ok: string }>('/cart', { auth: 'required' }),
      apiRequest<{ ok: string }>('/categories', { auth: 'required' }),
    ]);

    expect(refreshCount).toBe(1);
    expect(a.ok).toContain('/users/me');
    expect(b.ok).toContain('/cart');
    expect(c.ok).toContain('/categories');
  });

  it('logout refreshes expiring token first and always clears local storage even if request fails', async () => {
    setAuthenticatedSession({
      accessToken: 'expiring-soon',
      accessExpiresIn: 10,
      name: 'Ada',
      email: 'ada@example.com',
    });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          name: 'Ada',
          email: 'ada@example.com',
          accessToken: 'refreshed-for-logout',
          accessExpiresIn: 900,
        }),
      )
      .mockRejectedValueOnce(new Error('Network down during logout'));
    vi.stubGlobal('fetch', fetchMock);

    await logoutSession({ redirectTo: null });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/auth/refreshToken');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('/auth/logout');
    expect(readStoredSessionRaw()).toBeNull();
    expect(readHasSessionHint()).toBe(false);
    expect(sessionState.value.status).toBe('anonymous');
  });

  it('sends credentials=include and navigator.locks("rm-refresh") during refresh, and repeats multi-value query params', async () => {
    expect(buildApiUrl('/products', { pageNumber: 1, tags: ['linen', 'brass'] })).toBe(
      '/api/products?pageNumber=1&tags=linen&tags=brass',
    );

    const lockSpy = vi.fn(async (_name: string, cb: () => Promise<unknown>) => cb());
    vi.stubGlobal('navigator', { ...navigator, locks: { request: lockSpy } });

    setAuthenticatedSession({
      accessToken: 'stale-token',
      accessExpiresIn: 900,
    });

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({
          name: 'Ada',
          email: 'ada@example.com',
          accessToken: 'locked-token',
          accessExpiresIn: 900,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest<{ ok: boolean }>('/users/me', { auth: 'required' });
    expect(lockSpy).toHaveBeenCalledWith('rm-refresh', expect.any(Function));
    expect(fetchMock.mock.calls[1]?.[1]?.credentials).toBe('include');
  });
});
