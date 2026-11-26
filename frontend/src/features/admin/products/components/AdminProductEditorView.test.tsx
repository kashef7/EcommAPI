import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHttpAuthConfigured, resetAuthCoordinationForTests } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { clearResourceCache } from '@/core/data/useResource';
import { clearToasts, toastsSignal } from '@/ui/Toast/toast-store';
import { AdminProductEditorView } from './AdminProductEditorView';

const originalLocation = window.location;

function mockLocation(search = '') {
  const assign = vi.fn();
  const replace = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      pathname: '/admin/product.html',
      search,
      href: `http://localhost:5173/admin/product.html${search}`,
      origin: 'http://localhost:5173',
      assign,
      replace,
    },
  });
  return { assign, replace };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const CAT_ID = '11111111-2222-3333-4444-555555555555';
const CAT_2_ID = '11111111-2222-3333-4444-666666666666';
const PROD_ID = '22222222-2222-3333-4444-555555555555';

const SAMPLE_CATEGORIES = [
  { id: CAT_ID, name: 'Stationery', createdAt: '', updatedAt: '' },
  { id: CAT_2_ID, name: 'Deskware', createdAt: '', updatedAt: '' },
];

const SAMPLE_TAGS = [{ id: 't1', name: 'linen', createdAt: '' }];

const SAMPLE_PRODUCT = {
  id: PROD_ID,
  name: 'Linen Notebook',
  description: 'Thread-sewn linen notebook.',
  category: { id: CAT_ID, name: 'Stationery' },
  tags: ['linen'],
  images: [{ url: 'https://cdn.example.com/1.jpg', sortOrder: 0 }],
  options: [
    {
      id: 'opt-1',
      name: 'Size',
      values: [
        { id: 'val-1', value: 'A5' },
        { id: 'val-2', value: 'A4' },
      ],
    },
  ],
  variants: [
    {
      id: 'var-1',
      price: 24,
      stockQuantity: 10,
      optionValues: { Size: 'A5' },
    },
    {
      id: 'var-2',
      price: 30,
      stockQuantity: 5,
      optionValues: { Size: 'A4' },
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  clearResourceCache();
  clearToasts();
  window.sessionStorage.clear();
  resetAuthCoordinationForTests();
  ensureHttpAuthConfigured();
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
  clearToasts();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('AdminProductEditorView', () => {
  it('create mode: generates combinations, maps Variants[0].Price server errors, and redirects on create', async () => {
    const { assign } = mockLocation('');

    let postAttempt = 0;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input, init) => {
      const url = String(input);
      if (url.includes('/categories')) {
        return Promise.resolve(jsonResponse(SAMPLE_CATEGORIES));
      }
      if (url.includes('/tags')) {
        return Promise.resolve(jsonResponse(SAMPLE_TAGS));
      }
      if (init?.method === 'POST' && url.endsWith('/products')) {
        postAttempt += 1;
        if (postAttempt === 1) {
          return Promise.resolve(
            jsonResponse(
              {
                status: 400,
                title: 'One or more validation errors occurred.',
                errors: {
                  'Variants[0].Price': ['Price rejected by server rule.'],
                },
              },
              400,
            ),
          );
        }
        return Promise.resolve(jsonResponse({ ...SAMPLE_PRODUCT, id: PROD_ID }, 201));
      }
      return Promise.resolve(jsonResponse({}));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminProductEditorView />);

    await waitFor(() => {
      expect(screen.getByText('This product has a single version')).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Stationery' })).toBeTruthy();
    });

    fireEvent.input(screen.getByLabelText(/Product name/i), {
      target: { value: 'Traveler Journal' },
    });
    fireEvent.input(screen.getByLabelText(/Description/i), {
      target: { value: 'Archival paper notebook.' },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: CAT_ID },
    });

    // Tag lowercased via comma
    fireEvent.input(screen.getByLabelText(/^Tags/i), { target: { value: 'Brass,' } });
    expect(screen.getByText('brass')).toBeTruthy();

    // Add option and generate combinations
    fireEvent.click(screen.getByRole('button', { name: 'Add option' }));
    fireEvent.input(screen.getByLabelText(/Option name/i), { target: { value: 'Size' } });
    fireEvent.input(screen.getByLabelText(/^Values/i), { target: { value: 'A5, A4,' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate combinations' }));

    expect(screen.getByText('Size: A5')).toBeTruthy();
    expect(screen.getByText('Size: A4')).toBeTruthy();

    const priceInputs = screen.getAllByLabelText(/^Price/i) as HTMLInputElement[];
    fireEvent.input(priceInputs[0]!, { target: { value: '22' } });
    fireEvent.input(priceInputs[1]!, { target: { value: '28' } });

    // Submit 1 -> server validation error on Variants[0].Price maps to row 0 input
    fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

    await waitFor(() => {
      expect(screen.getByText('Price rejected by server rule.')).toBeTruthy();
    });
    expect(priceInputs[0]?.getAttribute('aria-invalid')).toBe('true');

    // Submit 2 -> succeeds and redirects
    fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(`/admin/product.html?id=${PROD_ID}`);
    });
  });

  it('create mode: prompts ConfirmDialog when generated variant combinations exceed 50', async () => {
    mockLocation('');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation((input) => {
        const url = String(input);
        if (url.includes('/categories')) return Promise.resolve(jsonResponse(SAMPLE_CATEGORIES));
        if (url.includes('/tags')) return Promise.resolve(jsonResponse(SAMPLE_TAGS));
        return Promise.resolve(jsonResponse({}));
      }),
    );

    render(<AdminProductEditorView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add option' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add option' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add option' }));

    const nameInputs = screen.getAllByLabelText(/Option name/i);
    const valueInputs = screen.getAllByLabelText(/^Values/i);

    fireEvent.input(nameInputs[0]!, { target: { value: 'OptA' } });
    fireEvent.input(valueInputs[0]!, {
      target: { value: '1,2,3,4,5,6,7,8,9,' },
    });

    fireEvent.input(nameInputs[1]!, { target: { value: 'OptB' } });
    fireEvent.input(valueInputs[1]!, {
      target: { value: 'a,b,c,d,e,f,' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Generate combinations' }));

    expect(screen.getByText('This creates 54 variants. Continue?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('OptA: 1, OptB: a')).toBeTruthy();
  });

  it('edit mode: sends PATCH with only changed fields, handles relative stock delta, Add option with existingVariantsValue, duplicate Add variant guard, and Delete product', async () => {
    const { assign } = mockLocation(`?id=${PROD_ID}`);
    const addBeforeUnloadSpy = vi.spyOn(window, 'addEventListener');

    let currentProduct = structuredClone(SAMPLE_PRODUCT);
    let patchBody: unknown = null;
    let priceBody: unknown = null;
    let stockBody: unknown = null;
    let addOptionBody: unknown = null;

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/categories')) {
        return jsonResponse(SAMPLE_CATEGORIES);
      }
      if (url.includes('/tags')) {
        return jsonResponse(SAMPLE_TAGS);
      }
      if (init?.method === 'PATCH' && url.endsWith(`/products/${PROD_ID}`)) {
        patchBody = JSON.parse(String(init.body));
        currentProduct = { ...currentProduct, name: 'Linen Notebook Revised' };
        return new Response(null, { status: 204 });
      }
      if (init?.method === 'PATCH' && url.endsWith('/variants/var-1')) {
        priceBody = JSON.parse(String(init.body));
        currentProduct = {
          ...currentProduct,
          variants: currentProduct.variants.map((v) =>
            v.id === 'var-1' ? { ...v, price: 29 } : v,
          ),
        };
        return new Response(null, { status: 204 });
      }
      if (init?.method === 'PATCH' && url.endsWith('/stock')) {
        const parsed = JSON.parse(String(init.body)) as { delta: number };
        stockBody = parsed;
        let nextStock = 10;
        currentProduct = {
          ...currentProduct,
          variants: currentProduct.variants.map((v) => {
            if (v.id !== 'var-1') return v;
            nextStock = v.stockQuantity + parsed.delta;
            return { ...v, stockQuantity: nextStock };
          }),
        };
        return jsonResponse({ id: 'var-1', stock: nextStock });
      }
      if (init?.method === 'POST' && url.endsWith(`/products/${PROD_ID}/options`)) {
        addOptionBody = JSON.parse(String(init.body));
        return jsonResponse(currentProduct);
      }
      if (init?.method === 'DELETE' && url.endsWith(`/options/opt-1`)) {
        return jsonResponse(
          {
            status: 409,
            title: 'Conflict',
            detail:
              'Cannot delete option: a product with no options must have exactly one active variant.',
          },
          409,
        );
      }
      if (init?.method === 'DELETE' && url.endsWith(`/products/${PROD_ID}`)) {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith(`/products/${PROD_ID}`)) {
        return jsonResponse(currentProduct);
      }
      return jsonResponse({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminProductEditorView />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Linen Notebook' })).toBeTruthy();
    });

    // Details save button disabled initially, becomes dirty with Unsaved changes + beforeunload
    const saveDetailsBtn = screen.getByRole('button', {
      name: 'Save changes',
    }) as HTMLButtonElement;
    expect(saveDetailsBtn.disabled).toBe(true);
    expect(screen.queryByText('Unsaved changes')).toBeNull();

    fireEvent.input(screen.getByLabelText(/Product name/i), {
      target: { value: 'Linen Notebook Revised' },
    });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect(saveDetailsBtn.disabled).toBe(false);
    expect(addBeforeUnloadSpy.mock.calls.some(([ev]) => ev === 'beforeunload')).toBe(true);

    fireEvent.click(saveDetailsBtn);

    await waitFor(() => {
      expect(patchBody).toEqual({ name: 'Linen Notebook Revised' });
      expect(screen.getByRole('heading', { name: 'Linen Notebook Revised' })).toBeTruthy();
    });

    const productGetCount = () =>
      fetchMock.mock.calls.filter(
        ([u, init]) =>
          (!init?.method || init.method === 'GET') && String(u).endsWith(`/products/${PROD_ID}`),
      ).length;

    // Variant price inline edit + Save (triggers GET refetch #3)
    const priceField = screen.getByLabelText('Price for Size: A5') as HTMLInputElement;
    fireEvent.input(priceField, { target: { value: '29' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save price for Size: A5' }));

    await waitFor(() => {
      expect(priceBody).toEqual({ price: 29 });
      expect(productGetCount()).toBeGreaterThanOrEqual(3);
      expect(
        (screen.getByRole('button', { name: 'Add stock for Size: A5' }) as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });

    // Relative stock adjust: Add 3 (GET refetch #4) then Remove 2 (GET refetch #5) on Size: A5
    const stockInput = screen.getByLabelText('Stock change for Size: A5') as HTMLInputElement;
    fireEvent.input(stockInput, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add stock for Size: A5' }));

    await waitFor(() => {
      expect(stockBody).toEqual({ delta: 3 });
      expect(screen.getByText('13 in stock')).toBeTruthy();
      expect(productGetCount()).toBeGreaterThanOrEqual(4);
      expect(
        (screen.getByRole('button', { name: 'Remove stock for Size: A5' }) as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });
    expect(toastsSignal.value.some((t) => t.message === 'Stock updated to 13.')).toBe(true);

    fireEvent.input(stockInput, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove stock for Size: A5' }));

    await waitFor(() => {
      expect(stockBody).toEqual({ delta: -2 });
      expect(screen.getByText('11 in stock')).toBeTruthy();
      expect(productGetCount()).toBeGreaterThanOrEqual(5);
      expect(
        (screen.getByRole('button', { name: 'Delete option Size' }) as HTMLButtonElement).disabled,
      ).toBe(false);
    });

    // Delete option 409 conflict banner
    fireEvent.click(screen.getByRole('button', { name: 'Delete option Size' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete option' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Cannot delete option: a product with no options must have exactly one active variant.',
        ),
      ).toBeTruthy();
    });

    // Add option dialog requires Value for existing variants, clears stale value on chip removal, and submits selected value
    fireEvent.click(screen.getByRole('button', { name: 'Add option' }));
    const existingValSelect = screen.getByLabelText(
      /Value for existing variants/i,
    ) as HTMLSelectElement;
    expect(existingValSelect).toBeTruthy();
    fireEvent.input(screen.getByLabelText(/Option name/i), { target: { value: 'Finish' } });
    fireEvent.input(screen.getByLabelText(/^Values/i), { target: { value: 'Matte, Gloss,' } });
    fireEvent.change(existingValSelect, { target: { value: 'Matte' } });
    expect(existingValSelect.value).toBe('Matte');

    // Removing the selected chip clears existingVariantsValue so stale value cannot be submitted
    fireEvent.click(screen.getByRole('button', { name: 'Remove value Matte' }));
    expect(existingValSelect.value).toBe('');
    const addOptionSubmitBtns = screen.getAllByRole('button', { name: 'Add option' });
    fireEvent.click(addOptionSubmitBtns[addOptionSubmitBtns.length - 1]!);
    expect(screen.getByText('Choose a value for existing variants.')).toBeTruthy();

    fireEvent.change(existingValSelect, { target: { value: 'Gloss' } });
    fireEvent.click(addOptionSubmitBtns[addOptionSubmitBtns.length - 1]!);

    await waitFor(() => {
      expect(addOptionBody).toEqual({
        name: 'Finish',
        values: ['Gloss'],
        existingVariantsValue: 'Gloss',
      });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(productGetCount()).toBeGreaterThanOrEqual(6);
      expect(
        (screen.getByRole('button', { name: 'Add variant' }) as HTMLButtonElement).disabled,
      ).toBe(false);
    });

    // Add variant dialog blocks duplicate combination
    fireEvent.click(screen.getByRole('button', { name: 'Add variant' }));
    expect(screen.getByText('A variant with this combination already exists.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Delete product with ConfirmDialog naming the product and bypassing beforeunload
    fireEvent.click(screen.getByRole('button', { name: 'Delete product' }));
    expect(screen.getByText('Delete "Linen Notebook Revised"?')).toBeTruthy();
    const confirmDeleteButtons = screen.getAllByRole('button', { name: 'Delete product' });
    fireEvent.click(confirmDeleteButtons[confirmDeleteButtons.length - 1]!);

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith('/admin/index.html');
    });
    const unloadAfterDelete = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unloadAfterDelete);
    expect(unloadAfterDelete.defaultPrevented).toBe(false);
  });

  it('create mode: zero-options single version product omits options and reorders images', async () => {
    const { assign } = mockLocation('');
    let postBody: unknown = null;

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/categories')) return jsonResponse(SAMPLE_CATEGORIES);
        if (url.includes('/tags')) return jsonResponse(SAMPLE_TAGS);
        if (init?.method === 'POST' && url.endsWith('/products')) {
          postBody = JSON.parse(String(init.body));
          return jsonResponse({ ...SAMPLE_PRODUCT, id: PROD_ID }, 201);
        }
        return jsonResponse({});
      }),
    );

    render(<AdminProductEditorView />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Stationery' })).toBeTruthy();
    });

    fireEvent.input(screen.getByLabelText(/Product name/i), {
      target: { value: 'Brass Ruler' },
    });
    fireEvent.input(screen.getByLabelText(/Description/i), {
      target: { value: 'Solid brass 15cm ruler.' },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: CAT_ID } });

    fireEvent.click(screen.getByRole('button', { name: 'Add image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add image' }));
    fireEvent.input(screen.getByLabelText('Image 1 URL'), {
      target: { value: 'https://cdn.example.com/first.jpg' },
    });
    fireEvent.input(screen.getByLabelText('Image 2 URL'), {
      target: { value: 'https://cdn.example.com/second.jpg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Move image 2 up' }));

    fireEvent.input(screen.getByLabelText(/^Price/i), { target: { value: '35' } });
    fireEvent.input(screen.getByLabelText(/^Stock/i), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create product' }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(`/admin/product.html?id=${PROD_ID}`);
    });
    expect(postBody).toEqual({
      name: 'Brass Ruler',
      description: 'Solid brass 15cm ruler.',
      categoryId: CAT_ID,
      imageUrls: ['https://cdn.example.com/second.jpg', 'https://cdn.example.com/first.jpg'],
      variants: [{ price: 35, stockQuantity: 8 }],
    });
  });

  it('edit mode: surfaces 409 Insufficient Stock on remove and sends empty tags array when cleared', async () => {
    mockLocation(`?id=${PROD_ID}`);
    let patchBody: unknown = null;

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.includes('/categories')) return jsonResponse(SAMPLE_CATEGORIES);
        if (url.includes('/tags')) return jsonResponse(SAMPLE_TAGS);
        if (init?.method === 'PATCH' && url.endsWith('/stock')) {
          return jsonResponse(
            { status: 409, title: 'Insufficient Stock', detail: 'Requested 50, only 10 left.' },
            409,
          );
        }
        if (init?.method === 'PATCH' && url.endsWith(`/products/${PROD_ID}`)) {
          patchBody = JSON.parse(String(init.body));
          return new Response(null, { status: 204 });
        }
        return jsonResponse(SAMPLE_PRODUCT);
      }),
    );

    render(<AdminProductEditorView />);

    await waitFor(() => {
      expect(screen.getByText('linen')).toBeTruthy();
    });

    fireEvent.input(screen.getByLabelText('Stock change for Size: A5'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove stock for Size: A5' }));

    await waitFor(() => {
      expect(screen.getByText('Requested 50, only 10 left.')).toBeTruthy();
    });
    expect(toastsSignal.value.some((t) => t.message === 'Requested 50, only 10 left.')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Remove tag linen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(patchBody).toEqual({ tags: [] });
    });
  });

  it('edit mode: explains why the last remaining variant cannot be deleted', async () => {
    mockLocation(`?id=${PROD_ID}`);
    const singleVariantProduct = {
      ...SAMPLE_PRODUCT,
      options: [],
      variants: [{ id: 'var-only', price: 24, stockQuantity: 10, optionValues: {} }],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation((input) => {
        const url = String(input);
        if (url.includes('/categories')) return Promise.resolve(jsonResponse(SAMPLE_CATEGORIES));
        if (url.includes('/tags')) return Promise.resolve(jsonResponse(SAMPLE_TAGS));
        return Promise.resolve(jsonResponse(singleVariantProduct));
      }),
    );

    render(<AdminProductEditorView />);

    await waitFor(() => {
      expect(screen.getByText('Last variant cannot be removed.')).toBeTruthy();
    });
    const deleteVarBtn = screen.getByRole('button', {
      name: 'Delete variant Single version',
    }) as HTMLButtonElement;
    expect(deleteVarBtn.disabled).toBe(true);
  });
});
