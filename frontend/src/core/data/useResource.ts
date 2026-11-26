import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ResourceOptions {
  readonly enabled?: boolean;
  readonly ttlMs?: number;
  readonly staleWhileRevalidate?: boolean;
}

export interface ResourceResult<T> {
  readonly data: T | undefined;
  readonly error: unknown;
  readonly status: ResourceStatus;
  readonly isStale: boolean;
  readonly reload: () => void;
}

interface CacheEntry {
  readonly data: unknown;
  readonly storedAt: number;
}

const resourceCache = new Map<string, CacheEntry>();

export function invalidateResourceCache(keyOrPrefix: string): void {
  for (const key of resourceCache.keys()) {
    if (
      key === keyOrPrefix ||
      key.startsWith(`${keyOrPrefix}:`) ||
      key.startsWith(`${keyOrPrefix}?`)
    ) {
      resourceCache.delete(key);
    }
  }
}

export function clearResourceCache(): void {
  resourceCache.clear();
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

export function useResource<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: ResourceOptions = {},
): ResourceResult<T> {
  const { enabled = true, ttlMs = 0, staleWhileRevalidate = true } = options;

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const requestSeqRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const initialCache = key && ttlMs > 0 ? resourceCache.get(key) : undefined;
  const initialFresh = initialCache !== undefined && Date.now() - initialCache.storedAt < ttlMs;

  const [data, setData] = useState<T | undefined>(
    initialCache ? (initialCache.data as T) : undefined,
  );
  const [error, setError] = useState<unknown>(undefined);
  const [status, setStatus] = useState<ResourceStatus>(() => {
    if (!enabled || !key) return 'idle';
    if (initialCache) return 'success';
    return 'loading';
  });
  const [isStale, setIsStale] = useState<boolean>(Boolean(initialCache && !initialFresh));

  const reload = useCallback(() => {
    setReloadVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !key) {
      controllerRef.current?.abort();
      setStatus('idle');
      return;
    }

    const cached = ttlMs > 0 ? resourceCache.get(key) : undefined;
    const isForceReload = reloadVersion > 0;

    if (cached && !isForceReload) {
      const age = Date.now() - cached.storedAt;
      if (age < ttlMs) {
        setData(cached.data as T);
        setError(undefined);
        setStatus('success');
        setIsStale(false);
        return;
      }
      if (staleWhileRevalidate) {
        setData(cached.data as T);
        setError(undefined);
        setStatus('success');
        setIsStale(true);
      } else {
        setStatus('loading');
        setIsStale(false);
      }
    } else {
      if (!cached) {
        setStatus('loading');
      }
      setIsStale(false);
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    requestSeqRef.current += 1;
    const seq = requestSeqRef.current;

    void fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted || seq !== requestSeqRef.current) {
          return;
        }
        if (ttlMs > 0) {
          resourceCache.set(key, { data: result, storedAt: Date.now() });
        }
        setData(result);
        setError(undefined);
        setStatus('success');
        setIsStale(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || isAbortError(err) || seq !== requestSeqRef.current) {
          return;
        }
        setError(err);
        setStatus('error');
        setIsStale(false);
      });

    return () => {
      controller.abort();
    };
  }, [key, enabled, ttlMs, staleWhileRevalidate, reloadVersion]);

  return { data, error, status, isStale, reload };
}

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface MutationResult<TArgs, TResult> {
  readonly run: (args: TArgs) => Promise<TResult>;
  readonly status: MutationStatus;
  readonly error: unknown;
  readonly submitting: boolean;
  readonly reset: () => void;
}

export function useMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
): MutationResult<TArgs, TResult> {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<MutationStatus>('idle');
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setStatus('idle');
      setError(undefined);
    }
  }, []);

  const run = useCallback(async (args: TArgs): Promise<TResult> => {
    if (mountedRef.current) {
      setStatus('loading');
      setError(undefined);
    }
    try {
      const result = await fnRef.current(args);
      if (mountedRef.current) {
        setStatus('success');
      }
      return result;
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err);
        setStatus('error');
      }
      throw err;
    }
  }, []);

  return {
    run,
    status,
    error,
    submitting: status === 'loading',
    reset,
  };
}
