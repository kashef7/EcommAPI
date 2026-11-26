import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHttpAuthConfigured, resetAuthCoordinationForTests } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { THEME_STORAGE_KEY } from '@/core/storage/safe-storage';
import { syncThemeFromEnvironmentForTests } from '@/core/theme/theme';
import { LoginView } from './LoginView';
import { SignupView } from './SignupView';

const originalLocation = window.location;

function mockWindowLocation(pathname: string, search = '') {
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
  sessionState.value = { status: 'anonymous' };
  window.sessionStorage.clear();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  syncThemeFromEnvironmentForTests();
  resetAuthCoordinationForTests();
  ensureHttpAuthConfigured();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('LoginView', () => {
  it('redirects away when already authenticated', () => {
    const { replace } = mockWindowLocation('/login.html', '?next=%2Fcart.html');
    sessionState.value = {
      status: 'authenticated',
      accessToken: 'tok',
      expiresAt: Date.now() + 60_000,
      isAdmin: false,
      name: 'Clara',
      email: 'clara@example.com',
    };

    render(<LoginView />);

    expect(replace).toHaveBeenCalledWith('/cart.html');
    expect(screen.queryByRole('heading', { name: 'Sign in' })).toBeNull();
  });

  it('exposes an accessible theme toggle inside AuthCardLayout', () => {
    mockWindowLocation('/login.html', '');
    render(<LoginView />);

    const toggleBtn = screen.getByRole('button', { name: 'Switch to dark theme' });
    fireEvent.click(toggleBtn);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeTruthy();
  });

  it('shows redirect notice and preserves sanitized next on the signup switch link', () => {
    mockWindowLocation('/login.html', '?next=%2Fproduct.html%3Fid%3D123');
    render(<LoginView />);

    expect(screen.getByText('Please sign in to continue.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create an account' }).getAttribute('href')).toBe(
      '/signup.html?next=%2Fproduct.html%3Fid%3D123',
    );
  });

  it('focuses the first invalid field on submit and preserves entered values on error', async () => {
    mockWindowLocation('/login.html', '');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            status: 401,
            title: 'Invalid Credentials',
            detail: 'Invalid email or password.',
          },
          401,
        ),
      ),
    );

    render(<LoginView />);

    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.click(submitBtn);
    expect(document.activeElement).toBe(emailInput);
    expect(screen.getByText('Email address is required.')).toBeTruthy();

    fireEvent.input(emailInput, { target: { value: 'clara@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'wrongpass123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('That email and password do not match.')).toBeTruthy();
    });

    expect(emailInput.value).toBe('clara@example.com');
    expect(passwordInput.value).toBe('wrongpass123');
  });

  it('authenticates and navigates to sanitized next on valid login', async () => {
    const { assign } = mockWindowLocation('/login.html', '?next=%2Fcart.html');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
          name: 'Clara',
          email: 'clara@example.com',
          accessToken: 'header.eyJzdWIiOiIxIiwiZW1haWwiOiJjbGFyYUBleGFtcGxlLmNvbSJ9.sig',
          accessExpiresIn: 900,
          refreshToken: 'secret-ignored',
          refreshTokenExpiresAt: '2027-01-01T00:00:00Z',
        }),
      ),
    );

    render(<LoginView />);

    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'clara@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/^Password/i), {
      target: { value: 'correcthorse' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith('/cart.html');
    });
    expect(sessionState.value.status).toBe('authenticated');
  });
});

describe('SignupView', () => {
  it('shows live password length hint, preserves next on switch link, and maps server field errors', async () => {
    mockWindowLocation('/signup.html', '?next=%2Fprofile.html');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(
          {
            status: 400,
            title: 'One or more validation errors occurred.',
            errors: {
              Email: ['Email is already registered.'],
            },
          },
          400,
        ),
      ),
    );

    render(<SignupView />);

    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe(
      '/login.html?next=%2Fprofile.html',
    );
    expect(screen.getByText('8 to 72 characters (0 entered)')).toBeTruthy();

    const nameInput = screen.getByLabelText(/Full name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/Confirm password/i) as HTMLInputElement;

    fireEvent.input(nameInput, { target: { value: 'Clara Oswald' } });
    fireEvent.input(emailInput, { target: { value: 'clara@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'secret1234' } });
    expect(screen.getByText('8 to 72 characters (10 entered)')).toBeTruthy();

    fireEvent.input(confirmInput, { target: { value: 'secret1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Email is already registered.')).toBeTruthy();
    });
    expect(document.activeElement).toBe(emailInput);
    expect(nameInput.value).toBe('Clara Oswald');
  });
});
