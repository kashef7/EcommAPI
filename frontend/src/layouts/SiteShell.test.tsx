import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as refreshModule from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { consumeFlashToast } from '@/core/storage/safe-storage';
import { resetCartSummary } from '@/features/cart';
import { AdminShell } from './AdminShell';
import { SiteShell } from './SiteShell';

const originalLocation = window.location;

function mockWindowLocation(pathname = '/index.html', search = '') {
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

beforeEach(() => {
  refreshModule.resetAuthCoordinationForTests();
  refreshModule.ensureHttpAuthConfigured();
  sessionState.value = { status: 'unknown' };
  resetCartSummary();
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ cartItems: [], totalPrice: 0 })),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
  window.sessionStorage.clear();
});

describe('SiteShell', () => {
  it('renders an account skeleton without auth buttons while session is unknown', () => {
    const fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);
    sessionState.value = { status: 'unknown' };

    render(
      <SiteShell activeNav="shop">
        <h1>Home</h1>
      </SiteShell>,
    );

    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Create account' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Account menu' })).toBeNull();
    expect(document.querySelector('[aria-hidden="true"] span[aria-hidden="true"]')).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('renders Sign in and Create account when anonymous', () => {
    const fetchSpy = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchSpy);
    mockWindowLocation('/index.html', '');
    sessionState.value = { status: 'anonymous' };

    render(
      <SiteShell activeNav="shop">
        <h1>Home</h1>
      </SiteShell>,
    );

    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe('/login.html');
    expect(screen.getByRole('link', { name: 'Create account' }).getAttribute('href')).toBe(
      '/signup.html',
    );
    expect(screen.queryByRole('button', { name: 'Account menu' })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('renders account Menu for authenticated non-admin without Admin item', () => {
    sessionState.value = {
      status: 'authenticated',
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      isAdmin: false,
      name: 'Clara',
      email: 'clara@example.com',
    };

    render(
      <SiteShell>
        <h1>Home</h1>
      </SiteShell>,
    );

    const trigger = screen.getByRole('button', { name: /Clara/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Admin' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeTruthy();
  });

  it('renders Admin item in account Menu for admins and triggers logout on Sign out', () => {
    const logoutSpy = vi.spyOn(refreshModule, 'logoutSession').mockResolvedValue();
    sessionState.value = {
      status: 'authenticated',
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      isAdmin: true,
      name: 'Ada',
      email: 'ada@example.com',
    };

    render(
      <SiteShell>
        <h1>Home</h1>
      </SiteShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Ada/i }));
    expect(screen.getByRole('menuitem', { name: 'Admin' }).getAttribute('href')).toBe(
      '/admin/index.html',
    );

    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('displays cart count badge with 99+ cap and toggles mobile navigation cleanly', async () => {
    sessionState.value = {
      status: 'authenticated',
      accessToken: 'tok-badge',
      expiresAt: Date.now() + 60_000,
      isAdmin: false,
      name: 'Clara',
      email: 'clara@example.com',
    };
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ cartItems: [{ quantity: 120 }], totalPrice: 1200 })),
    );

    render(
      <SiteShell activeNav="shop">
        <h1>Home</h1>
      </SiteShell>,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Cart, 120 items/i })).toBeTruthy();
      expect(screen.getByText('99+')).toBeTruthy();
    });

    const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(menuButton);
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).toBeNull();
    expect(document.activeElement).toBe(menuButton);
  });
});

describe('AdminShell', () => {
  it('redirects authenticated non-admins to home with flash toast', () => {
    const { replace } = mockWindowLocation('/admin/index.html', '');
    sessionState.value = {
      status: 'authenticated',
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      isAdmin: false,
      name: 'Clara',
      email: 'clara@example.com',
    };

    render(
      <AdminShell activeSection="products">
        <h1>Secret Admin</h1>
      </AdminShell>,
    );

    expect(screen.queryByText('Secret Admin')).toBeNull();
    expect(replace).toHaveBeenCalledWith('/index.html');
    expect(consumeFlashToast()).toEqual({
      variant: 'error',
      message: 'You do not have access to that page.',
    });
  });

  it('renders secondary admin nav and children for admins', () => {
    sessionState.value = {
      status: 'authenticated',
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      isAdmin: true,
      name: 'Ada',
      email: 'ada@example.com',
    };

    render(
      <AdminShell activeSection="categories">
        <h1>Manage categories</h1>
      </AdminShell>,
    );

    const nav = screen.getByRole('navigation', { name: 'Administration navigation' });
    expect(nav).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Categories' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByText('Manage categories')).toBeTruthy();
  });
});
