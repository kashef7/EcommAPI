import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastHost } from './ToastHost';
import { clearToasts, toast } from './toast-store';

afterEach(() => {
  clearToasts();
  cleanup();
  vi.useRealTimers();
});

describe('Toast and ToastHost', () => {
  it('uses polite live region for success and assertive alert for errors', () => {
    render(<ToastHost />);
    act(() => {
      toast.success('Added to your cart');
      toast.error('We could not reach the server.');
    });

    const status = screen.getByRole('status');
    const alert = screen.getByRole('alert');

    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Added to your cart');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(alert.textContent).toContain('We could not reach the server.');
  });

  it('auto-dismisses after 5s unless hovered and closes on dismiss click', () => {
    vi.useFakeTimers();
    render(<ToastHost />);
    act(() => {
      toast.info('Saved preference');
    });

    const status = screen.getByRole('status');
    fireEvent.mouseEnter(status);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByRole('status')).toBeTruthy();

    fireEvent.mouseLeave(status);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      toast.info('Focus pause check');
    });
    const focusStatus = screen.getByRole('status');
    const dismissFocusBtn = screen.getByRole('button', { name: 'Dismiss notification' });
    fireEvent.focusIn(dismissFocusBtn);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByRole('status')).toBe(focusStatus);
    fireEvent.focusOut(dismissFocusBtn);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      toast.success('Profile updated');
    });
    const dismiss = screen.getByRole('button', { name: 'Dismiss notification' });
    fireEvent.click(dismiss);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
