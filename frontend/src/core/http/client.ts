import { env } from '@/config/env';
import { logger } from '@/core/logging/logger';
import { ApiError } from './api-error';
import { parseProblemDetails } from './problem-details';

export type QueryParamValue = string | number | boolean | readonly string[] | null | undefined;

export type HttpAuthMode = 'none' | 'optional' | 'required';

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly query?: Readonly<Record<string, QueryParamValue>>;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly auth?: HttpAuthMode;
  readonly credentials?: RequestCredentials;
}

export interface HttpAuthHooks {
  readonly getAccessToken: () => string | null;
  readonly isAccessTokenExpiring: () => boolean;
  readonly refreshAccessToken: () => Promise<string | null>;
  readonly handleAuthExpired: () => void;
}

let authHooks: HttpAuthHooks | null = null;

export function configureHttpAuth(hooks: HttpAuthHooks | null): void {
  authHooks = hooks;
}

export function buildApiUrl(
  path: string,
  query?: Readonly<Record<string, QueryParamValue>>,
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const basePath = `${env.apiBaseUrl}${normalizedPath}`;

  if (!query) {
    return basePath;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && String(item).length > 0) {
          params.append(key, String(item));
        }
      }
      continue;
    }
    const str = String(value);
    if (str.length > 0) {
      params.append(key, str);
    }
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

async function parseResponseText(
  response: Response,
): Promise<{ hasText: boolean; parsed: unknown }> {
  const rawText = await response.text();
  if (rawText.trim().length === 0) {
    return { hasText: false, parsed: undefined };
  }
  try {
    return { hasText: true, parsed: JSON.parse(rawText) as unknown };
  } catch {
    throw new ApiError({
      kind: 'parse',
      status: response.status,
      title: 'Invalid Response',
      detail: 'Server returned malformed JSON.',
    });
  }
}

export async function apiVoidRequest(path: string, options: RequestOptions = {}): Promise<void> {
  await apiRequest<unknown>(path, options);
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    query,
    body,
    headers: customHeaders,
    signal: externalSignal,
    timeoutMs = env.requestTimeoutMs,
    auth = 'optional',
    credentials = 'same-origin',
  } = options;

  const url = buildApiUrl(path, query);
  const startTime = performance.now();

  let bearerToken: string | null = null;
  if (auth !== 'none' && authHooks) {
    bearerToken = authHooks.getAccessToken();
    const shouldRefreshProactively =
      (auth === 'required' && (!bearerToken || authHooks.isAccessTokenExpiring())) ||
      (auth === 'optional' && bearerToken !== null && authHooks.isAccessTokenExpiring());

    if (shouldRefreshProactively) {
      bearerToken = await authHooks.refreshAccessToken();
    }
  }

  if (auth === 'required' && !bearerToken) {
    throw new ApiError({
      kind: 'http',
      status: 401,
      title: 'Unauthorized',
      detail: '',
    });
  }

  const executeAttempt = async (tokenToUse: string | null): Promise<Response> => {
    if (externalSignal?.aborted) {
      throw externalSignal.reason instanceof Error
        ? externalSignal.reason
        : new DOMException('The operation was aborted.', 'AbortError');
    }

    const controller = new AbortController();
    let timedOut = false;

    const onExternalAbort = () => {
      controller.abort(externalSignal?.reason);
    };
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

    const timeoutHandle = globalThis.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(customHeaders ?? {}),
    };
    if (body !== undefined && !('Content-Type' in headers)) {
      headers['Content-Type'] = 'application/json';
    }
    if (tokenToUse) {
      headers['Authorization'] = `Bearer ${tokenToUse}`;
    }

    try {
      return await fetch(url, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        credentials,
        signal: controller.signal,
      });
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime);
      if (timedOut) {
        logger.error('HTTP request timed out', { method, path, durationMs });
        throw new ApiError({
          kind: 'timeout',
          status: 0,
          title: 'Timeout',
          detail: '',
        });
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw err;
      }
      logger.error('HTTP network error', { method, path, durationMs });
      throw new ApiError({
        kind: 'network',
        status: 0,
        title: 'Network Error',
        detail: '',
      });
    } finally {
      globalThis.clearTimeout(timeoutHandle);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  };

  let response = await executeAttempt(bearerToken);

  if (
    response.status === 401 &&
    auth !== 'none' &&
    authHooks &&
    (bearerToken !== null || auth === 'required')
  ) {
    const refreshedToken = await authHooks.refreshAccessToken();
    if (refreshedToken) {
      response = await executeAttempt(refreshedToken);
      if (response.status === 401) {
        authHooks.handleAuthExpired();
      }
    } else {
      authHooks.handleAuthExpired();
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  logger.debug('HTTP request', { method, path, status: response.status, durationMs });

  if (response.status === 204) {
    return undefined as T;
  }

  let parsedBody: unknown = undefined;
  let hasBodyText = false;
  try {
    const result = await parseResponseText(response);
    hasBodyText = result.hasText;
    parsedBody = result.parsed;
  } catch (parseErr) {
    if (!response.ok) {
      if (response.status >= 500) {
        logger.error('HTTP server error with unparseable body', {
          method,
          path,
          status: response.status,
          durationMs,
        });
      }
      throw new ApiError({
        kind: 'http',
        status: response.status,
        title: response.statusText || 'Request Failed',
        detail: '',
      });
    }
    throw parseErr;
  }

  if (!response.ok) {
    if (response.status >= 500) {
      logger.error('HTTP server error', {
        method,
        path,
        status: response.status,
        durationMs,
      });
    }
    const problem = hasBodyText
      ? parseProblemDetails(parsedBody, response.status)
      : {
          status: response.status,
          title: '',
          detail: '',
          fieldErrors: {},
        };

    throw new ApiError({
      kind: 'http',
      status: problem.status,
      title: problem.title,
      detail: problem.detail,
      fieldErrors: problem.fieldErrors,
    });
  }

  return parsedBody as T;
}
