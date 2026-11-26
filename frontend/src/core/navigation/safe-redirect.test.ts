import { describe, expect, it } from 'vitest';
import { sanitizeRedirect } from './safe-redirect';

describe('sanitizeRedirect', () => {
  it('accepts safe same-origin relative paths and query strings', () => {
    expect(sanitizeRedirect('/cart.html?x=1')).toBe('/cart.html?x=1');
    expect(sanitizeRedirect('/product.html?id=123#reviews')).toBe('/product.html?id=123#reviews');
    expect(sanitizeRedirect('/admin/index.html')).toBe('/admin/index.html');
  });

  it('rejects protocol-relative, external URLs, backslashes, and schemes', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/index.html');
    expect(sanitizeRedirect('https://evil.com/cart.html')).toBe('/index.html');
    expect(sanitizeRedirect('http://evil.com')).toBe('/index.html');
    expect(sanitizeRedirect('/\\evil')).toBe('/index.html');
    expect(sanitizeRedirect('/%5cevil')).toBe('/index.html');
    expect(sanitizeRedirect('/%2f/evil.com')).toBe('/index.html');
    expect(sanitizeRedirect('javascript:alert(1)')).toBe('/index.html');
    expect(sanitizeRedirect('')).toBe('/index.html');
    expect(sanitizeRedirect(null)).toBe('/index.html');
  });
});
