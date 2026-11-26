import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('money formatting', () => {
  it('formats amounts with Intl.NumberFormat for configured locale and currency', () => {
    expect(formatMoney(48.5, 'en-US', 'USD')).toBe('$48.50');
    expect(formatMoney(1200, 'en-GB', 'GBP')).toBe('£1,200.00');
  });

  it('handles non-finite numbers safely as zero', () => {
    expect(formatMoney(Number.NaN, 'en-US', 'USD')).toBe('$0.00');
  });
});
