import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearResourceCache } from '@/core/data/useResource';
import { CatalogView } from './CatalogView';

const originalLocation = window.location;

function mockLocation(search = '') {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      pathname: '/index.html',
      search,
      href: `http://localhost:5173/index.html${search}`,
      origin: 'http://localhost:5173',
    },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const CAT_ID = '11111111-2222-3333-4444-555555555555';

function makeProductsResponse(count = 5) {
  return {
    items: Array.from({ length: count }, (_, idx) => ({
      id: `00000000-0000-0000-0000-00000000000${idx + 1}`,
      name: `Linen Item ${idx + 1}`,
      categoryName: 'Stationery',
      primaryImageUrl: `https://cdn.example.com/item-${idx + 1}.jpg`,
      minPrice: 12 + idx,
      inStock: idx !== 4,
      tags: ['linen', 'brass', 'extra'],
    })),
    totalCount: count,
    pageNumber: 1,
    pageSize: 12,
    totalPages: 1,
  };
}

beforeEach(() => {
  clearResourceCache();
  mockLocation('');
  vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
  vi.spyOn(window.history, 'replaceState').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('CatalogView', () => {
  it('loads products with orderDesc=true for Newest and marks only the first row images eager', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('/categories')) {
        return Promise.resolve(
          jsonResponse([{ id: CAT_ID, name: 'Stationery', createdAt: '', updatedAt: '' }]),
        );
      }
      if (url.includes('/tags')) {
        return Promise.resolve(jsonResponse([{ id: 't1', name: 'linen', createdAt: '' }]));
      }
      return Promise.resolve(jsonResponse(makeProductsResponse(5)));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CatalogView />);

    await waitFor(() => {
      expect(screen.getByText('5 products')).toBeTruthy();
    });

    const productCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/products'),
    );
    expect(String(productCalls[0]?.[0])).toContain('orderDesc=true');
    expect(String(productCalls[0]?.[0])).not.toContain('orderBy=');

    const imgs = screen.getAllByRole('img') as HTMLImageElement[];
    expect(imgs).toHaveLength(5);
    expect(imgs.slice(0, 4).every((img) => img.getAttribute('loading') === 'eager')).toBe(true);
    expect(imgs[4]?.getAttribute('loading')).toBe('lazy');
    expect(screen.getByText('Sold out')).toBeTruthy();
  });

  it('debounces search by 350ms, supports sort switches, and opens mobile filter dialog', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('/categories')) {
        return Promise.resolve(
          jsonResponse([{ id: CAT_ID, name: 'Stationery', createdAt: '', updatedAt: '' }]),
        );
      }
      if (url.includes('/tags')) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve(jsonResponse(makeProductsResponse(2)));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CatalogView />);
    await waitFor(() => {
      expect(screen.getByText('2 products')).toBeTruthy();
    });

    vi.useFakeTimers();
    const searchInput = screen.getByLabelText(/Search products/i);
    fireEvent.input(searchInput, { target: { value: 'Brass' } });

    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('name=Brass'))).toBe(false);

    vi.advanceTimersByTime(350);
    vi.useRealTimers();

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('name=Brass'))).toBe(true);
    });

    fireEvent.change(screen.getByLabelText(/Sort by/i), {
      target: { value: 'price-asc' },
    });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url]) =>
            String(url).includes('orderBy=price') && String(url).includes('orderDesc=false'),
        ),
      ).toBe(true);
    });

    fireEvent.click(screen.getByRole('button', { name: /^Filters/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show results' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders empty state with Clear filters action when no products match', async () => {
    mockLocation('?name=Nonexistent');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation((input) => {
        const url = String(input);
        if (url.includes('/categories') || url.includes('/tags')) {
          return Promise.resolve(jsonResponse([]));
        }
        return Promise.resolve(
          jsonResponse({ items: [], totalCount: 0, pageNumber: 1, pageSize: 12, totalPages: 0 }),
        );
      }),
    );

    render(<CatalogView />);

    await waitFor(() => {
      expect(screen.getByText('No products match your filters')).toBeTruthy();
    });
  });

  it('keeps toggled filters when a debounced search finishes and syncs drafts on popstate', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('/categories')) {
        return Promise.resolve(
          jsonResponse([{ id: CAT_ID, name: 'Stationery', createdAt: '', updatedAt: '' }]),
        );
      }
      if (url.includes('/tags')) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve(jsonResponse(makeProductsResponse(2)));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CatalogView />);
    await waitFor(() => {
      expect(screen.getByText('2 products')).toBeTruthy();
    });

    vi.useFakeTimers();
    const searchInput = screen.getByLabelText(/Search products/i) as HTMLInputElement;
    fireEvent.input(searchInput, { target: { value: 'Linen' } });
    fireEvent.click(screen.getByLabelText('In stock only'));

    vi.advanceTimersByTime(350);
    vi.useRealTimers();

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url]) => String(url).includes('name=Linen') && String(url).includes('inStock=true'),
        ),
      ).toBe(true);
    });

    mockLocation('?name=Brass&minPrice=15');
    fireEvent(window, new PopStateEvent('popstate'));

    await waitFor(() => {
      expect(searchInput.value).toBe('Brass');
    });
  });
});
