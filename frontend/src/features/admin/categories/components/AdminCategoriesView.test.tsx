import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHttpAuthConfigured, resetAuthCoordinationForTests } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { clearResourceCache } from '@/core/data/useResource';
import { clearToasts, toastsSignal } from '@/ui/Toast/toast-store';
import { ToastHost } from '@/ui/Toast/ToastHost';
import { AdminCategoriesView } from './AdminCategoriesView';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SAMPLE_CATEGORIES = [
  { id: 'cat-1', name: 'Stationery', createdAt: '', updatedAt: '' },
  { id: 'cat-2', name: 'Deskware', createdAt: '', updatedAt: '' },
];

beforeEach(() => {
  clearResourceCache();
  clearToasts();
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
});

describe('AdminCategoriesView', () => {
  it('loads categories, creates a new category, and handles inline rename via Enter and Escape', async () => {
    const afterCreate = [
      ...SAMPLE_CATEGORIES,
      { id: 'cat-3', name: 'Journals', createdAt: '', updatedAt: '' },
    ];
    const afterRename = [
      { id: 'cat-1', name: 'Fine Stationery', createdAt: '', updatedAt: '' },
      SAMPLE_CATEGORIES[1],
      afterCreate[2],
    ];

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CATEGORIES))
      .mockResolvedValueOnce(
        jsonResponse({ id: 'cat-3', name: 'Journals', createdAt: '', updatedAt: '' }, 201),
      )
      .mockResolvedValueOnce(jsonResponse(afterCreate))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse(afterRename));
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminCategoriesView />);

    await waitFor(() => {
      expect(screen.getByText('Stationery')).toBeTruthy();
    });

    // Create category
    const input = screen.getByLabelText(/Category name/i) as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'Journals' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add category' }));

    await waitFor(() => {
      expect(screen.getByText('Journals')).toBeTruthy();
    });
    expect(toastsSignal.value.some((t) => t.message === 'Category created.')).toBe(true);

    // Inline rename: Escape cancels without calling PATCH
    fireEvent.click(screen.getByRole('button', { name: 'Rename Stationery' }));
    const editInput = screen.getByLabelText(/Rename category/i) as HTMLInputElement;
    fireEvent.input(editInput, { target: { value: 'Temp Name' } });
    fireEvent.keyDown(editInput, { key: 'Escape' });
    expect(screen.queryByLabelText(/Rename category/i)).toBeNull();

    // Inline rename: Enter / form submit saves
    fireEvent.click(screen.getByRole('button', { name: 'Rename Stationery' }));
    const editInput2 = screen.getByLabelText(/Rename category/i) as HTMLInputElement;
    fireEvent.input(editInput2, { target: { value: 'Fine Stationery' } });
    fireEvent.submit(editInput2.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Fine Stationery')).toBeTruthy();
    });
    expect(toastsSignal.value.some((t) => t.message === 'Category renamed.')).toBe(true);
  });

  it('surfaces 409 Category Has Products in both a banner and a toast on delete', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(SAMPLE_CATEGORIES))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: 409,
            title: 'Category Has Products',
            detail: 'Category still contains products.',
          },
          409,
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <>
        <AdminCategoriesView />
        <ToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText('Stationery')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Stationery' }));
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(document.activeElement).toBe(cancelBtn);

    fireEvent.click(screen.getByRole('button', { name: 'Delete category' }));

    await waitFor(() => {
      const matches = screen.getAllByText(
        'This category still has products. Move or remove them first.',
      );
      // Appears in both Banner and Toast
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
    expect(
      toastsSignal.value.some(
        (t) => t.message === 'This category still has products. Move or remove them first.',
      ),
    ).toBe(true);
  });
});
