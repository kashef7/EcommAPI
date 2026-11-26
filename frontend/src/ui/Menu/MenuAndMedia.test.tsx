import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageWithFallback, isAllowedImageUrl } from '../ImageWithFallback/ImageWithFallback';
import { Menu } from '../Menu/Menu';
import { SegmentedOptionGroup } from '../SegmentedOptionGroup/SegmentedOptionGroup';

afterEach(cleanup);

describe('Menu keyboard interaction', () => {
  it('opens with ArrowDown, cycles items, and restores focus on Escape', () => {
    render(
      <Menu
        triggerLabel="Account"
        triggerText="Account"
        items={[
          { id: 'profile', label: 'Profile', href: '/profile.html' },
          { id: 'signout', label: 'Sign out', onSelect: vi.fn() },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Account' });
    trigger.focus();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const profileItem = screen.getByRole('menuitem', { name: 'Profile' });
    const signoutItem = screen.getByRole('menuitem', { name: 'Sign out' });
    expect(document.activeElement).toBe(profileItem);

    fireEvent.keyDown(profileItem.closest('[role="menu"]')!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(signoutItem);

    fireEvent.keyDown(signoutItem.closest('[role="menu"]')!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('ImageWithFallback URL validation', () => {
  it('allows only http and https protocols and falls back safely otherwise', () => {
    expect(isAllowedImageUrl('https://cdn.example.com/item.jpg')).toBe(true);
    expect(isAllowedImageUrl('http://localhost:5126/item.jpg')).toBe(true);
    expect(isAllowedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedImageUrl('data:image/svg+xml,<svg/>')).toBe(false);
    expect(isAllowedImageUrl('not a url')).toBe(false);

    const { rerender } = render(
      <ImageWithFallback src="javascript:alert(1)" alt="Blocked image" fallbackText="No preview" />,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('No preview')).toBeTruthy();

    rerender(<ImageWithFallback src="https://cdn.example.com/linen.jpg" alt="Linen notebook" />);
    const img = screen.getByRole('img', { name: 'Linen notebook' }) as HTMLImageElement;
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('decoding')).toBe('async');

    fireEvent.error(img);
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('SegmentedOptionGroup', () => {
  it('keeps sold-out options focusable and selectable, supports arrow keys, and blocks unavailable options', () => {
    const onChange = vi.fn();
    render(
      <SegmentedOptionGroup
        label="Size"
        value="M"
        onChange={onChange}
        options={[
          { value: 'M', label: 'Medium', available: true, inStock: true },
          { value: 'L', label: 'Large', available: true, inStock: false },
          { value: 'XL', label: 'XL', available: false, inStock: false },
        ]}
      />,
    );

    const mediumBtn = screen.getByRole('radio', { name: /Medium/i });
    const soldOutBtn = screen.getByRole('radio', { name: /Large/i });
    const unavailableBtn = screen.getByRole('radio', { name: /XL/i });

    expect(soldOutBtn.getAttribute('aria-disabled')).toBe('true');
    expect(unavailableBtn.getAttribute('aria-disabled')).toBe('true');

    mediumBtn.focus();
    fireEvent.keyDown(mediumBtn, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(soldOutBtn);
    expect(onChange).toHaveBeenCalledWith('L');

    fireEvent.click(unavailableBtn);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
