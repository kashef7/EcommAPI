import { describe, expect, it } from 'vitest';
import { computeCartItemCount, formatCartBadgeCount } from './cart-summary';

describe('cart-summary model', () => {
  it('sums positive finite item quantities', () => {
    expect(computeCartItemCount([])).toBe(0);
    expect(computeCartItemCount([{ quantity: 2 }, { quantity: 5 }])).toBe(7);
  });

  it('formats cart badge count with zero hidden and 99+ cap', () => {
    expect(formatCartBadgeCount(0)).toBeNull();
    expect(formatCartBadgeCount(-2)).toBeNull();
    expect(formatCartBadgeCount(1)).toBe('1');
    expect(formatCartBadgeCount(99)).toBe('99');
    expect(formatCartBadgeCount(100)).toBe('99+');
  });
});
