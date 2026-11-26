export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppEnv {
  readonly appName: string;
  readonly apiBaseUrl: string;
  readonly requestTimeoutMs: number;
  readonly locale: string;
  readonly currencyCode: string;
  readonly pageSize: number;
  readonly logLevel: LogLevel;
  readonly lowStockThreshold: number;
  readonly isDev: boolean;
  readonly isProd: boolean;
}

export type EnvValidationResult =
  | { readonly ok: true; readonly env: AppEnv }
  | { readonly ok: false; readonly errors: readonly string[] };

const VALID_LOG_LEVELS: ReadonlySet<string> = new Set<LogLevel>(['debug', 'info', 'warn', 'error']);

const DEFAULT_APP_NAME = 'Royal Market';
const DEFAULT_API_BASE_URL = '/api';
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const MIN_REQUEST_TIMEOUT_MS = 100;
const MAX_REQUEST_TIMEOUT_MS = 300_000;
const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY_CODE = 'USD';
const DEFAULT_PAGE_SIZE = 12;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 50;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const MAX_LOW_STOCK_THRESHOLD = 100_000;

function readRawBoolean(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = raw[key];
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
}

function readOptionalNonEmptyString(
  raw: Record<string, unknown>,
  key: string,
  defaultValue: string,
  errors: string[],
): string {
  const value = raw[key];
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${key} must be a non-empty string.`);
    return defaultValue;
  }
  return value.trim();
}

function parseApiBaseUrl(raw: Record<string, unknown>, errors: string[]): string {
  const value = readOptionalNonEmptyString(raw, 'VITE_API_BASE_URL', DEFAULT_API_BASE_URL, errors);
  if (/\s/.test(value)) {
    errors.push('VITE_API_BASE_URL must not contain whitespace.');
    return DEFAULT_API_BASE_URL;
  }

  if (value.startsWith('/')) {
    if (value.startsWith('//')) {
      errors.push('VITE_API_BASE_URL must not start with "//".');
      return DEFAULT_API_BASE_URL;
    }
    return value.replace(/\/+$/, '');
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      errors.push('VITE_API_BASE_URL must use http, https, or a root-relative path.');
      return DEFAULT_API_BASE_URL;
    }
    return value.replace(/\/+$/, '');
  } catch {
    errors.push('VITE_API_BASE_URL must be a valid http(s) URL or root-relative path.');
    return DEFAULT_API_BASE_URL;
  }
}

function parseInteger(
  raw: Record<string, unknown>,
  key: string,
  defaultValue: number,
  errors: string[],
): number {
  const value = raw[key];
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      errors.push(`${key} must be a valid integer.`);
      return defaultValue;
    }
    return value;
  }
  if (typeof value !== 'string' || !/^-?\d+$/.test(value.trim())) {
    errors.push(`${key} must be a valid integer.`);
    return defaultValue;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isSafeInteger(parsed)) {
    errors.push(`${key} must be a valid safe integer.`);
    return defaultValue;
  }
  return parsed;
}

function parseLocale(raw: Record<string, unknown>, errors: string[]): string {
  const value = readOptionalNonEmptyString(raw, 'VITE_LOCALE', DEFAULT_LOCALE, errors);
  if (/\s/.test(value)) {
    errors.push('VITE_LOCALE must be a valid BCP 47 locale tag.');
    return DEFAULT_LOCALE;
  }
  try {
    const canonical = Intl.getCanonicalLocales(value);
    if (canonical.length === 0) {
      errors.push('VITE_LOCALE must be a valid BCP 47 locale tag.');
      return DEFAULT_LOCALE;
    }
    new Intl.NumberFormat(canonical[0]);
    return canonical[0] ?? value;
  } catch {
    errors.push('VITE_LOCALE must be a valid BCP 47 locale tag.');
    return DEFAULT_LOCALE;
  }
}

function parseCurrencyCode(raw: Record<string, unknown>, locale: string, errors: string[]): string {
  const value = readOptionalNonEmptyString(
    raw,
    'VITE_CURRENCY_CODE',
    DEFAULT_CURRENCY_CODE,
    errors,
  );
  if (!/^[A-Z]{3}$/.test(value)) {
    errors.push('VITE_CURRENCY_CODE must be a 3-letter uppercase ISO currency code.');
    return DEFAULT_CURRENCY_CODE;
  }
  if (typeof Intl.supportedValuesOf === 'function') {
    const supportedCurrencies = Intl.supportedValuesOf('currency');
    if (!supportedCurrencies.includes(value)) {
      errors.push('VITE_CURRENCY_CODE is not a recognized ISO 4217 currency code.');
      return DEFAULT_CURRENCY_CODE;
    }
  }
  try {
    new Intl.NumberFormat(locale, { style: 'currency', currency: value });
    return value;
  } catch {
    errors.push('VITE_CURRENCY_CODE is not supported as an ISO 4217 currency code.');
    return DEFAULT_CURRENCY_CODE;
  }
}

function parseLogLevel(raw: Record<string, unknown>, isDev: boolean, errors: string[]): LogLevel {
  const fallback: LogLevel = isDev ? 'debug' : 'warn';
  const value = raw['VITE_LOG_LEVEL'];
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !VALID_LOG_LEVELS.has(value.trim())) {
    errors.push('VITE_LOG_LEVEL must be one of debug, info, warn, or error.');
    return fallback;
  }
  return value.trim() as LogLevel;
}

export function validateEnv(raw: Record<string, unknown>): EnvValidationResult {
  const errors: string[] = [];

  const isDev = readRawBoolean(raw, 'DEV', false);
  const isProd = readRawBoolean(raw, 'PROD', !isDev);

  const appName = readOptionalNonEmptyString(raw, 'VITE_APP_NAME', DEFAULT_APP_NAME, errors);
  if (appName.length > 100) {
    errors.push('VITE_APP_NAME must be 100 characters or fewer.');
  }

  const apiBaseUrl = parseApiBaseUrl(raw, errors);

  const requestTimeoutMs = parseInteger(
    raw,
    'VITE_REQUEST_TIMEOUT_MS',
    DEFAULT_REQUEST_TIMEOUT_MS,
    errors,
  );
  if (requestTimeoutMs < MIN_REQUEST_TIMEOUT_MS || requestTimeoutMs > MAX_REQUEST_TIMEOUT_MS) {
    errors.push(
      `VITE_REQUEST_TIMEOUT_MS must be between ${MIN_REQUEST_TIMEOUT_MS} and ${MAX_REQUEST_TIMEOUT_MS}.`,
    );
  }

  const locale = parseLocale(raw, errors);
  const currencyCode = parseCurrencyCode(raw, locale, errors);

  const rawPageSize = parseInteger(raw, 'VITE_PAGE_SIZE', DEFAULT_PAGE_SIZE, errors);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, rawPageSize));

  const logLevel = parseLogLevel(raw, isDev, errors);

  const lowStockThreshold = parseInteger(
    raw,
    'VITE_LOW_STOCK_THRESHOLD',
    DEFAULT_LOW_STOCK_THRESHOLD,
    errors,
  );
  if (lowStockThreshold < 0 || lowStockThreshold > MAX_LOW_STOCK_THRESHOLD) {
    errors.push(`VITE_LOW_STOCK_THRESHOLD must be between 0 and ${MAX_LOW_STOCK_THRESHOLD}.`);
  }

  if (errors.length > 0) {
    return { ok: false, errors: Object.freeze(errors) };
  }

  const parsedEnv: AppEnv = Object.freeze({
    appName,
    apiBaseUrl,
    requestTimeoutMs,
    locale,
    currencyCode,
    pageSize,
    logLevel,
    lowStockThreshold,
    isDev,
    isProd,
  });

  return { ok: true, env: parsedEnv };
}

const FALLBACK_INVALID_ENV: AppEnv = Object.freeze({
  appName: DEFAULT_APP_NAME,
  apiBaseUrl: DEFAULT_API_BASE_URL,
  requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
  locale: DEFAULT_LOCALE,
  currencyCode: DEFAULT_CURRENCY_CODE,
  pageSize: DEFAULT_PAGE_SIZE,
  logLevel: 'warn',
  lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
  isDev: false,
  isProd: true,
});

const rawImportMetaEnv: Record<string, unknown> = import.meta.env;

export const envValidation: EnvValidationResult = validateEnv(rawImportMetaEnv);

export const env: AppEnv = envValidation.ok ? envValidation.env : FALLBACK_INVALID_ENV;
