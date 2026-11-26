import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

afterEach(cleanup);

describe('ThemeToggle', () => {
  it('renders Moon icon and "Switch to dark theme" label in light mode', () => {
    const onToggle = vi.fn();
    render(<ThemeToggle isDark={false} onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Switch to dark theme' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders Sun icon and "Switch to light theme" label in dark mode (icon and menu-row)', () => {
    const onToggle = vi.fn();
    render(<ThemeToggle isDark variant="menu-row" tone="chrome" onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Switch to light theme' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Switch to light theme')).toBeTruthy();
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
