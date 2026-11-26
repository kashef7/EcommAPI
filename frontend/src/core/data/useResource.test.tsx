import { cleanup, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearResourceCache, invalidateResourceCache, useResource } from './useResource';

afterEach(cleanup);

beforeEach(() => {
  clearResourceCache();
});

function ResourceHarness({
  cacheKey,
  fetcher,
  ttlMs = 0,
}: {
  readonly cacheKey: string | null;
  readonly fetcher: (signal: AbortSignal) => Promise<string>;
  readonly ttlMs?: number;
}) {
  const res = useResource(cacheKey, fetcher, { ttlMs });
  return (
    <div>
      <span data-testid="status">{res.status}</span>
      <span data-testid="data">{res.data ?? ''}</span>
    </div>
  );
}

describe('useResource cache and abort lifecycle', () => {
  it('serves TTL-cached values until invalidated and aborts in-flight requests on key change', async () => {
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn(async (signal: AbortSignal) => {
      signals.push(signal);
      return `value-${signals.length}`;
    });

    const first = render(
      <ResourceHarness cacheKey="categories" fetcher={fetcher} ttlMs={60_000} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('success');
    });
    expect(screen.getByTestId('data').textContent).toBe('value-1');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Remounting with warm TTL cache serves immediately without re-fetching
    first.unmount();
    const second = render(
      <ResourceHarness cacheKey="categories" fetcher={fetcher} ttlMs={60_000} />,
    );
    expect(screen.getByTestId('data').textContent).toBe('value-1');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Changing key triggers new fetch and aborts previous signal on cleanup
    invalidateResourceCache('categories');
    second.rerender(<ResourceHarness cacheKey="tags" fetcher={fetcher} ttlMs={60_000} />);
    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('value-2');
    });
    expect(signals[0]?.aborted).toBe(true);
  });

  it('aborts in-flight fetch on unmount', async () => {
    let capturedSignal: AbortSignal | undefined;
    const pendingFetcher = vi.fn(
      (signal: AbortSignal) =>
        new Promise<string>(() => {
          capturedSignal = signal;
        }),
    );

    const view = render(<ResourceHarness cacheKey="pending" fetcher={pendingFetcher} />);
    await waitFor(() => {
      expect(capturedSignal).toBeDefined();
    });
    expect(capturedSignal?.aborted).toBe(false);

    view.unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('ignores stale responses that resolve out of order after a key change', async () => {
    let resolveFirst: ((val: string) => void) | undefined;
    let resolveSecond: ((val: string) => void) | undefined;

    const fetcher = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const view = render(<ResourceHarness cacheKey="k1" fetcher={fetcher} />);
    view.rerender(<ResourceHarness cacheKey="k2" fetcher={fetcher} />);

    resolveSecond?.('second');
    await waitFor(() => {
      expect(screen.getByTestId('data').textContent).toBe('second');
    });

    resolveFirst?.('stale-first');
    await Promise.resolve();
    expect(screen.getByTestId('data').textContent).toBe('second');
  });
});
