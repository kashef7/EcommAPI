import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as refreshModule from '@/core/auth/refresh';
import { ensureHttpAuthConfigured, resetAuthCoordinationForTests } from '@/core/auth/refresh';
import { sessionState } from '@/core/auth/session';
import { clearToasts, toastsSignal } from '@/ui/Toast/toast-store';
import { ProfileView } from './ProfileView';

const originalLocation = window.location;

function mockWindowLocation(pathname = '/profile.html', search = '') {
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
  clearToasts();
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
  clearToasts();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('ProfileView', () => {
  it('redirects anonymous visitors to login with next', () => {
    const { replace } = mockWindowLocation('/profile.html', '');
    sessionState.value = { status: 'anonymous' };

    render(<ProfileView />);

    expect(replace).toHaveBeenCalledWith('/login.html?next=%2Fprofile.html');
  });

  it('loads overview, updates email with toast and session refresh, and handles password update', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // Initial GET /api/users/me
      .mockResolvedValueOnce(jsonResponse({ name: 'Clara Oswald', email: 'clara@example.com' }))
      // PATCH /api/users/updateEmail
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // Refresh token after email update
      .mockResolvedValueOnce(
        jsonResponse({
          name: 'Clara Oswald',
          email: 'clara.new@example.com',
          accessToken: 'tok-2',
          accessExpiresIn: 900,
        }),
      )
      // Reload GET /api/users/me
      .mockResolvedValueOnce(jsonResponse({ name: 'Clara Oswald', email: 'clara.new@example.com' }))
      // PATCH /api/users/updatePassword -> 400 Incorrect Password
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: 400,
            title: 'Incorrect Password',
            detail: 'Old password did not match.',
          },
          400,
        ),
      )
      // PATCH /api/users/updatePassword -> 204
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    vi.stubGlobal('fetch', fetchMock);

    render(<ProfileView />);

    await waitFor(() => {
      expect(screen.getByText('Clara Oswald')).toBeTruthy();
      expect(screen.getByText('clara@example.com')).toBeTruthy();
    });

    // Update email
    const newEmailInput = screen.getByLabelText(/New email/i) as HTMLInputElement;
    fireEvent.input(newEmailInput, { target: { value: 'clara.new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update email' }));

    await waitFor(() => {
      expect(screen.getByText('clara.new@example.com')).toBeTruthy();
    });
    expect(toastsSignal.value.some((t) => t.message === 'Email address updated.')).toBe(true);

    // Update password: first failure keeps entered values
    const currentPwd = screen.getByLabelText(/Current password/i) as HTMLInputElement;
    const newPwd = screen.getByLabelText(/^New password/i) as HTMLInputElement;
    const confirmPwd = screen.getByLabelText(/Confirm new password/i) as HTMLInputElement;

    fireEvent.input(currentPwd, { target: { value: 'wrongpass' } });
    fireEvent.input(newPwd, { target: { value: 'newpassword123' } });
    fireEvent.input(confirmPwd, { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(screen.getByText('Your current password is not correct.')).toBeTruthy();
    });
    expect(currentPwd.value).toBe('wrongpass');
    expect(newPwd.value).toBe('newpassword123');

    // Second attempt succeeds and clears fields
    fireEvent.input(currentPwd, { target: { value: 'correctpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(currentPwd.value).toBe('');
      expect(newPwd.value).toBe('');
      expect(confirmPwd.value).toBe('');
    });
    expect(toastsSignal.value.some((t) => t.message === 'Password updated.')).toBe(true);
  });

  it('signs out directly without confirmation dialog', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ name: 'Clara', email: 'clara@example.com' })),
    );
    const logoutSpy = vi.spyOn(refreshModule, 'logoutSession').mockResolvedValue();

    render(<ProfileView />);

    await waitFor(() => {
      expect(screen.getByText('Clara')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps email update successful even if silent JWT refresh fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ name: 'Clara', email: 'clara@example.com' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ name: 'Clara', email: 'clara.updated@example.com' }));

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(refreshModule, 'refreshAccessToken').mockRejectedValueOnce(
      new Error('Transient refresh failure'),
    );

    render(<ProfileView />);

    await waitFor(() => {
      expect(screen.getByText('clara@example.com')).toBeTruthy();
    });

    fireEvent.input(screen.getByLabelText(/New email/i), {
      target: { value: 'clara.updated@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update email' }));

    await waitFor(() => {
      expect(screen.getByText('clara.updated@example.com')).toBeTruthy();
    });
    expect(toastsSignal.value.some((t) => t.message === 'Email address updated.')).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
