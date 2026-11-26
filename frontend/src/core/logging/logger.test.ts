import { describe, expect, it, vi } from 'vitest';
import { logger, redactContext } from './logger';

describe('logger redaction', () => {
  it('redacts sensitive keys deeply across nested objects and arrays', () => {
    const redacted = redactContext({
      accessToken: 'abc.def.ghi',
      refreshToken: 'secret-refresh',
      nested: {
        oldPassword: 'pass1',
        authorization: 'Bearer xyz',
        cookie: 'refreshToken=123',
        safeField: 'visible',
      },
      items: [{ token: 't1', name: 'Notebook' }],
    }) as Record<string, unknown>;

    expect(redacted['accessToken']).toBe('[REDACTED]');
    expect(redacted['refreshToken']).toBe('[REDACTED]');
    const nested = redacted['nested'] as Record<string, unknown>;
    expect(nested['oldPassword']).toBe('[REDACTED]');
    expect(nested['authorization']).toBe('[REDACTED]');
    expect(nested['cookie']).toBe('[REDACTED]');
    expect(nested['safeField']).toBe('visible');
    const items = redacted['items'] as Array<Record<string, unknown>>;
    expect(items[0]?.['token']).toBe('[REDACTED]');
    expect(items[0]?.['name']).toBe('Notebook');
  });

  it('logs error entries with redacted context and sessionId', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.error('Auth failure', { password: 'my-secret-password', attempt: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = spy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload['level']).toBe('error');
    expect(typeof payload['sessionId']).toBe('string');
    expect((payload['context'] as Record<string, unknown>)['password']).toBe('[REDACTED]');
    expect((payload['context'] as Record<string, unknown>)['attempt']).toBe(1);
    spy.mockRestore();
  });
});
