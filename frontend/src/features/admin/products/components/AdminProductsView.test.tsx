import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHttpAuthConfigured, resetAuthCoordinationForTests } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { clearResourceCache } from '@/core/data/useResource';
import { clearToasts, toastsSignal } from '@/ui/Toast/toast-store';
import { AdminProductsView } from './AdminProductsView';

const originalLocation = window.location;

function mockLocation(search = '') {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      pathname: '/admin/index.html',
      search,
      href: `http://localhost:5173/admin/index.html${search}`,
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
const PROD_1 = '22222222-2222-3333-4444-555555555555';
const PROD_2 = '33333333-2222-3333-4444-555555555555';

const PRODUCTS_PAGE = {
  items: [
    {
      id: PROD_1,
      name: 'Linen Notebook',
      categoryName: 'Stationery',
      primaryImageUrl: 'https://cdn.example.com/notebook.jpg',
      minPrice: 24,
      inStock: true,
      tags: ['linen'],
    },
    {
      id: PROD_2,
      name: 'Brass Inkwell',
      categoryName: 'Deskware',
      primaryImageUrl: null,
      minPrice: 48,
      inStock: false,
      tags: ['brass'],
    },
  ],
  totalCount: 2,
  pageNumber: 1,
  pageSize: 12,
  totalPages: 1,
};

beforeEach(() => {
  clearResourceCache();
  clearToasts();
  mockLocation('');
  resetAuthCoordinationForTests();
  ensureHttpAuthConfigured();
  vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined);
  vi.spyOn(window.history, 'replaceState').mockImplementation(() => undefined);
  sessionState.value = {
    status: 'authenticated',
    accessToken: 'admin-tok',
    expiresAt: Date.now() + 60_000,
    isAdmin: true,
    name: 'Admin',
    email: 'admin@example.com',
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  clearToasts();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('AdminProductsView', () => {
  it('renders products table with links and deletes a product after confirmation', async () => {
    const afterDelete = {
      items: [PRODUCTS_PAGE.items[1]],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 12,
      totalPages: 1,
    };

    let deleted = false;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input, init) => {
      const url = String(input);
      if (url.includes('/categories')) {
        return Promise.resolve(
          jsonResponse([{ id: CAT_ID, name: 'Stationery', createdAt: '', updatedAt: '' }]),
        );
      }
      if (init?.method === 'DELETE') {
        deleted = true;
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(jsonResponse(deleted ? afterDelete : PRODUCTS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminProductsView />);

    await waitFor(() => {
      expect(screen.getByText('Linen Notebook')).toBeTruthy();
      expect(screen.getByText('From $24.00')).toBeTruthy();
      expect(screen.getByText('In stock')).toBeTruthy();
      expect(screen.getByText('Sold out')).toBeTruthy();
    });

    const newLink = screen.getByRole('link', { name: 'New product' }) as HTMLAnchorElement;
    expect(newLink.getAttribute('href')).toBe('/admin/product.html');

    const editLink = screen.getByRole('link', {
      name: 'Edit Linen Notebook',
    }) as HTMLAnchorElement;
    expect(editLink.getAttribute('href')).toBe(`/admin/product.html?id=${PROD_1}`);

    const shopLink = screen.getByRole('link', {
      name: 'View Linen Notebook in shop',
    }) as HTMLAnchorElement;
    expect(shopLink.getAttribute('href')).toBe(`/product.html?id=${PROD_1}`);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Linen Notebook' }));
    expect(screen.getByText('Delete "Linen Notebook"?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete product' }));

    await waitFor(() => {
      expect(screen.queryByText('Linen Notebook')).toBeNull();
    });
    expect(toastsSignal.value.some((t) => t.message === '"Linen Notebook" deleted.')).toBe(true);
  });

  it('debounces search input and filters by category', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const url = String(input);
      if (url.includes('/categories')) {
        return Promise.resolve(
          jsonResponse([{ id: CAT_ID, name: 'Stationery', createdAt: '', updatedAt: '' }]),
        );
      }
      return Promise.resolve(jsonResponse(PRODUCTS_PAGE));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminProductsView />);

    await waitFor(() => {
      expect(screen.getByText('Linen Notebook')).toBeTruthy();
    });

    vi.useFakeTimers();
    fireEvent.input(screen.getByLabelText(/Search products/i), {
      target: { value: 'Brass' },
    });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('name=Brass'))).toBe(false);

    vi.advanceTimersByTime(350);
    vi.useRealTimers();

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('name=Brass'))).toBe(true);
    });

    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: CAT_ID } });
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes(`categoryId=${CAT_ID}`)),
      ).toBe(true);
    });
  });
});
