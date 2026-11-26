import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHttpAuthConfigured, resetAuthCoordinationForTests } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { clearResourceCache } from '@/core/data/useResource';
import { clearToasts, toastsSignal } from '@/ui/Toast/toast-store';
import { cartSummary, resetCartSummary } from '../hooks/useCartSummary';
import { CartView } from './CartView';

const originalLocation = window.location;

function mockLocation(pathname = '/cart.html', search = '') {
  const replace = vi.fn();
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      pathname,
      search,
      href: `http://localhost:5173${pathname}${search}`,
      origin: 'http://localhost:5173',
      replace,
      assign,
    },
  });
  return { replace, assign };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SAMPLE_CART = {
  cartItems: [
    {
      variantId: 'var-1',
      productId: 'prod-1',
      productName: 'Linen Notebook',
      variantLabel: 'Size: A5',
      imageUrl: 'https://cdn.example.com/notebook.jpg',
      unitPrice: 15,
      quantity: 2,
      lineTotal: 30,
    },
    {
      variantId: 'var-2',
      productId: 'prod-2',
      productName: 'Brass Pen',
      variantLabel: '',
      imageUrl: null,
      unitPrice: 25,
      quantity: 1,
      lineTotal: 25,
    },
  ],
  totalPrice: 55,
};

beforeEach(() => {
  clearResourceCache();
  clearToasts();
  resetCartSummary();
  resetAuthCoordinationForTests();
  ensureHttpAuthConfigured();
  sessionState.value = {
    status: 'authenticated',
    accessToken: 'tok',
    expiresAt: Date.now() + 60_000,
    isAdmin: false,
    name: 'Clara',
    email: 'clara@example.com',
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

describe('CartView', () => {
  it('redirects anonymous visitors to login with next=/cart.html', () => {
    const { replace } = mockLocation('/cart.html', '');
    sessionState.value = { status: 'anonymous' };

    render(<CartView />);
    expect(replace).toHaveBeenCalledWith('/login.html?next=%2Fcart.html');
  });

  it('debounces quantity updates by 400ms, rolls back on 409 error with toast, and keeps cartSummary synced', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CART))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: 409,
            title: 'Insufficient Stock',
            detail: 'Only 2 units available for Linen Notebook.',
          },
          409,
        ),
      )
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CART));
    vi.stubGlobal('fetch', fetchMock);

    render(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Linen Notebook')).toBeTruthy();
    });
    expect(cartSummary.value.count).toBe(3);

    vi.useFakeTimers();
    const increaseButtons = screen.getAllByRole('button', { name: 'Increase quantity' });
    fireEvent.click(increaseButtons[0]!);

    // Optimistic update immediately
    expect(cartSummary.value.count).toBe(4);
    expect(screen.getByText('$70.00')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(400);
    vi.useRealTimers();

    await waitFor(() => {
      expect(
        toastsSignal.value.some((t) => t.message === 'Only 2 units available for Linen Notebook.'),
      ).toBe(true);
    });
    expect(cartSummary.value.count).toBe(3);
    expect(screen.getByText('$55.00')).toBeTruthy();
  });

  it('removes a single item without confirmation and requires ConfirmDialog for Clear cart', async () => {
    const afterRemove = {
      cartItems: [SAMPLE_CART.cartItems[1]],
      totalPrice: 25,
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CART))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse(afterRemove))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ cartItems: [], totalPrice: 0 }));

    vi.stubGlobal('fetch', fetchMock);

    render(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Linen Notebook')).toBeTruthy();
    });

    // Remove single item immediately (no ConfirmDialog)
    fireEvent.click(screen.getByRole('button', { name: 'Remove Linen Notebook from cart' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    await waitFor(() => {
      expect(screen.queryByText('Linen Notebook')).toBeNull();
      expect(cartSummary.value.count).toBe(1);
    });

    // Clear cart opens ConfirmDialog with Cancel focused by default
    fireEvent.click(screen.getByRole('button', { name: 'Clear cart' }));
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(document.activeElement).toBe(cancelBtn);

    const dialogConfirmButtons = screen.getAllByRole('button', { name: 'Clear cart' });
    fireEvent.click(dialogConfirmButtons[dialogConfirmButtons.length - 1]!);

    await waitFor(() => {
      expect(screen.getByText('Your cart is empty')).toBeTruthy();
    });
    expect(cartSummary.value.count).toBe(0);
  });

  it('handles Review cart with combined PriceChanged + InsufficientStock, Unavailable without (), and preserves notes after refetch', async () => {
    const updatedCart = {
      cartItems: [
        {
          ...SAMPLE_CART.cartItems[0],
          unitPrice: 18,
          lineTotal: 36,
        },
        SAMPLE_CART.cartItems[1],
      ],
      totalPrice: 61,
    };

    const quantityFixedCart = {
      cartItems: [
        {
          ...SAMPLE_CART.cartItems[0],
          unitPrice: 18,
          quantity: 1,
          lineTotal: 18,
        },
        SAMPLE_CART.cartItems[1],
      ],
      totalPrice: 43,
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      // Initial GET /cart
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CART))
      // POST /cart/validate (also includes duplicate `issues` field to ensure `items` is used)
      .mockResolvedValueOnce(
        jsonResponse({
          isValid: false,
          items: [
            {
              variantId: 'var-gone',
              productName: 'Archival Ink',
              variantLabel: '',
              issueTypes: ['Unavailable'],
              messages: [],
            },
            {
              variantId: 'var-1',
              productName: 'Linen Notebook',
              variantLabel: 'Size: A5',
              issueTypes: ['PriceChanged', 'InsufficientStock'],
              messages: [],
              oldPrice: 15,
              newPrice: 18,
              availableQuantity: 1,
            },
          ],
          issues: [],
        }),
      )
      // Post-validate refetch GET /cart
      .mockResolvedValueOnce(jsonResponse(updatedCart))
      // Immediate PUT when clicking "Set quantity to 1"
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // Reconcile GET /cart
      .mockResolvedValueOnce(jsonResponse(quantityFixedCart));

    vi.stubGlobal('fetch', fetchMock);

    render(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Linen Notebook')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Review cart' }));

    await waitFor(() => {
      expect(screen.getByText('Archival Ink is no longer available and was removed.')).toBeTruthy();
      expect(screen.getByText('Price changed from $15.00 to $18.00')).toBeTruthy();
      expect(screen.getByText('Only 1 available')).toBeTruthy();
      expect(screen.getByText('$61.00')).toBeTruthy();
    });

    // Click "Set quantity to 1" -> immediate PUT without waiting 400ms
    fireEvent.click(screen.getByRole('button', { name: 'Set quantity to 1' }));

    await waitFor(() => {
      expect(screen.getByText('$43.00')).toBeTruthy();
      expect(screen.queryByText('Only 1 available')).toBeNull();
    });
    // Price change note stays visible after fixing stock issue
    expect(screen.getByText('Price changed from $15.00 to $18.00')).toBeTruthy();
  });

  it('cancels pending quantity debounce timer when Review cart is clicked', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CART))
      .mockResolvedValueOnce(jsonResponse({ isValid: true, items: [] }))
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CART));
    vi.stubGlobal('fetch', fetchMock);

    render(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('Linen Notebook')).toBeTruthy();
    });

    vi.useFakeTimers();
    const increaseButtons = screen.getAllByRole('button', { name: 'Increase quantity' });
    fireEvent.click(increaseButtons[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Review cart' }));

    vi.advanceTimersByTime(500);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Your cart is up to date.')).toBeTruthy();
    });

    const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(putCalls).toHaveLength(0);
  });
});
