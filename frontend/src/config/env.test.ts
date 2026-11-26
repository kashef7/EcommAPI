import { describe, expect, it } from 'vitest';
import { env, validateEnv } from './env';

describe('env configuration validation', () => {
  it('applies documented defaults when optional variables are omitted', () => {
    const result = validateEnv({ DEV: false, PROD: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.appName).toBe('Royal Market');
      expect(result.env.apiBaseUrl).toBe('/api');
      expect(result.env.requestTimeoutMs).toBe(15000);
      expect(result.env.locale).toBe('en-US');
      expect(result.env.currencyCode).toBe('USD');
      expect(result.env.pageSize).toBe(12);
      expect(result.env.logLevel).toBe('warn');
      expect(result.env.lowStockThreshold).toBe(5);
      expect(Object.isFrozen(result.env)).toBe(true);
    }
  });

  it('defaults log level to debug in dev mode and parses valid custom values', () => {
    const result = validateEnv({
      DEV: true,
      PROD: false,
      VITE_APP_NAME: 'Crown Goods',
      VITE_API_BASE_URL: 'https://shop.example.com/api/',
      VITE_REQUEST_TIMEOUT_MS: '8000',
      VITE_LOCALE: 'en-GB',
      VITE_CURRENCY_CODE: 'GBP',
      VITE_PAGE_SIZE: '24',
      VITE_LOW_STOCK_THRESHOLD: '3',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.appName).toBe('Crown Goods');
      expect(result.env.apiBaseUrl).toBe('https://shop.example.com/api');
      expect(result.env.requestTimeoutMs).toBe(8000);
      expect(result.env.locale).toBe('en-GB');
      expect(result.env.currencyCode).toBe('GBP');
      expect(result.env.pageSize).toBe(24);
      expect(result.env.logLevel).toBe('debug');
      expect(result.env.lowStockThreshold).toBe(3);
    }
  });

  it('clamps VITE_PAGE_SIZE between 1 and 50', () => {
    const low = validateEnv({ VITE_PAGE_SIZE: '0' });
    const high = validateEnv({ VITE_PAGE_SIZE: '120' });
    expect(low.ok && low.env.pageSize).toBe(1);
    expect(high.ok && high.env.pageSize).toBe(50);
  });

  it('rejects missing/blank explicit variables', () => {
    const result = validateEnv({
      VITE_APP_NAME: '   ',
      VITE_API_BASE_URL: '',
      VITE_LOCALE: '',
      VITE_CURRENCY_CODE: '',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('VITE_APP_NAME'))).toBe(true);
      expect(result.errors.some((e) => e.includes('VITE_API_BASE_URL'))).toBe(true);
      expect(result.errors.some((e) => e.includes('VITE_LOCALE'))).toBe(true);
      expect(result.errors.some((e) => e.includes('VITE_CURRENCY_CODE'))).toBe(true);
    }
  });

  it('rejects malformed numbers, URLs, locales, currency codes, and log levels', () => {
    const result = validateEnv({
      VITE_API_BASE_URL: '//evil.example/api',
      VITE_REQUEST_TIMEOUT_MS: '15s',
      VITE_LOCALE: 'not a locale',
      VITE_CURRENCY_CODE: 'ABC',
      VITE_PAGE_SIZE: 'abc',
      VITE_LOG_LEVEL: 'verbose',
      VITE_LOW_STOCK_THRESHOLD: '-2',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(7);
    }
  });

  it('normalizes root "/" API base URL to empty prefix without creating protocol-relative URLs', () => {
    const result = validateEnv({ VITE_API_BASE_URL: '/' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.apiBaseUrl).toBe('');
    }
  });

  it('rejects out-of-range timeout values', () => {
    const tooSmall = validateEnv({ VITE_REQUEST_TIMEOUT_MS: '50' });
    const tooLarge = validateEnv({ VITE_REQUEST_TIMEOUT_MS: '999999' });
    expect(tooSmall.ok).toBe(false);
    expect(tooLarge.ok).toBe(false);
  });

  it('exports a frozen startup env object', () => {
    expect(Object.isFrozen(env)).toBe(true);
  });
});
