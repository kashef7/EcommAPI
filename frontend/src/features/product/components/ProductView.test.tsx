import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHttpAuthConfigured, resetAuthCoordinationForTests } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { clearResourceCache } from '@/core/data/useResource';
import { clearToasts, toastsSignal } from '@/ui/Toast/toast-store';
import { ProductView } from './ProductView';

const originalLocation = window.location;
const PRODUCT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function mockLocation(search = `?id=${PRODUCT_ID}`) {
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      pathname: '/product.html',
      search,
      href: `http://localhost:5173/product.html${search}`,
      origin: 'http://localhost:5173',
      assign,
    },
  });
  return { assign };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SAMPLE_PRODUCT = {
  id: PRODUCT_ID,
  name: 'Archival Linen Journal',
  description: 'Line one.\nLine two.',
  category: { id: '11111111-2222-3333-4444-555555555555', name: 'Stationery' },
  tags: ['linen', 'archival'],
  images: [
    { url: 'https://cdn.example.com/second.jpg', sortOrder: 2 },
    { url: 'https://cdn.example.com/first.jpg', sortOrder: 1 },
  ],
  options: [
    {
      id: 'opt-size',
      name: 'Size',
      values: [
        { id: 'val-a5', value: 'A5' },
        { id: 'val-a4', value: 'A4' },
      ],
    },
  ],
  variants: [
    {
      id: 'var-a5',
      price: 24,
      stockQuantity: 3,
      optionValues: { size: 'a5' },
    },
    {
      id: 'var-a4',
      price: 36,
      stockQuantity: 0,
      optionValues: { Size: 'A4' },
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  clearResourceCache();
  clearToasts();
  resetAuthCoordinationForTests();
  ensureHttpAuthConfigured();
  sessionState.value = { status: 'anonymous' };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  clearToasts();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('ProductView', () => {
  it('shows not-found state without fetching when id query param is invalid', () => {
    mockLocation('?id=invalid');
    const fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);

    render(<ProductView />);

    expect(screen.getByText('This product is no longer available')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows not-found state when API returns 404', async () => {
    mockLocation(`?id=${PRODUCT_ID}`);
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ status: 404, title: 'Not Found', detail: '' }, 404)),
    );

    render(<ProductView />);

    await waitFor(() => {
      expect(screen.getByText('This product is no longer available')).toBeTruthy();
    });
  });

  it('renders ordered gallery with eager high-priority main image, option states, and redirects anonymous add-to-cart', async () => {
    const { assign } = mockLocation(`?id=${PRODUCT_ID}`);
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(SAMPLE_PRODUCT)));

    render(<ProductView />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Archival Linen Journal' })).toBeTruthy();
    });

    const mainImg = screen.getByRole('img', { name: 'Archival Linen Journal' }) as HTMLImageElement;
    expect(mainImg.src).toBe('https://cdn.example.com/first.jpg');
    expect(mainImg.getAttribute('loading')).toBe('eager');
    expect(mainImg.getAttribute('fetchpriority')).toBe('high');

    // Initial selection is cheapest in-stock (A5, $24.00, Only 3 left)
    expect(screen.getByText('$24.00')).toBeTruthy();
    expect(screen.getByText('Only 3 left')).toBeTruthy();

    // Selecting sold-out A4 stays focusable and updates price + sold-out notice
    const soldOutRadio = screen.getByRole('radio', { name: /A4/i });
    expect(soldOutRadio.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(soldOutRadio);
    expect(screen.getByText('$36.00')).toBeTruthy();
    expect(screen.getByText('This selection is currently sold out.')).toBeTruthy();

    // Switch back to in-stock A5 and press Add to cart as anonymous -> login?next=...
    fireEvent.click(screen.getByRole('radio', { name: /A5/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(assign).toHaveBeenCalledWith(
      `/login.html?next=${encodeURIComponent(`/product.html?id=${PRODUCT_ID}`)}`,
    );
  });

  it('adds to cart when authenticated, updates callback + toast, and renders 409 inline', async () => {
    mockLocation(`?id=${PRODUCT_ID}`);
    sessionState.value = {
      status: 'authenticated',
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      isAdmin: false,
      name: 'Clara',
      email: 'clara@example.com',
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(SAMPLE_PRODUCT))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: 409,
            title: 'Insufficient Stock',
            detail: 'Only 3 units remain in stock.',
          },
          409,
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    const onCartUpdated = vi.fn();

    render(<ProductView onCartUpdated={onCartUpdated} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add to cart' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Added' })).toBeTruthy();
    });
    expect(onCartUpdated).toHaveBeenCalledTimes(1);
    expect(toastsSignal.value.some((t) => t.message === 'Added to your cart')).toBe(true);

    // Trigger 409 on second add
    fireEvent.click(screen.getByRole('button', { name: 'Added' }));

    await waitFor(() => {
      expect(screen.getByText('Only 3 units remain in stock.')).toBeTruthy();
    });

    // Changing quantity clears the inline 409 error
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.queryByText('Only 3 units remain in stock.')).toBeNull();
  });
});
