import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function setNavigatorSaveData(saveData: boolean | undefined) {
  Object.defineProperty(window.navigator, 'connection', {
    configurable: true,
    value: saveData === undefined ? undefined : { saveData },
  });
}

describe('link prefetching', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.replaceChildren();
    document.body.replaceChildren();
    window.history.replaceState({}, '', '/index.html');
    setNavigatorSaveData(undefined);
  });

  afterEach(() => {
    setNavigatorSaveData(undefined);
  });

  it('injects a single prefetch link for internal links on hover, focus, or touch', async () => {
    const { installLinkPrefetch } = await import('./prefetch');
    installLinkPrefetch();

    const productLink = document.createElement('a');
    productLink.href = '/product.html?id=123';
    productLink.textContent = 'Notebook';
    document.body.appendChild(productLink);

    productLink.dispatchEvent(new Event('pointerenter', { bubbles: false }));
    productLink.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    productLink.dispatchEvent(new Event('touchstart', { bubbles: false }));

    const links = document.head.querySelectorAll('link[rel="prefetch"]');
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe('/product.html?id=123');
  });

  it('ignores external origins, hashes, mailto links, and the current URL', async () => {
    const { installLinkPrefetch } = await import('./prefetch');
    installLinkPrefetch();

    const external = document.createElement('a');
    external.href = 'https://example.com/other';
    const hash = document.createElement('a');
    hash.setAttribute('href', '#section');
    const mailto = document.createElement('a');
    mailto.setAttribute('href', 'mailto:help@example.com');
    const current = document.createElement('a');
    current.href = '/index.html';

    document.body.append(external, hash, mailto, current);

    for (const anchor of [external, hash, mailto, current]) {
      anchor.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    }

    expect(document.head.querySelectorAll('link[rel="prefetch"]')).toHaveLength(0);
  });

  it('skips installation and prefetching when navigator.connection.saveData is true', async () => {
    setNavigatorSaveData(true);
    const { installLinkPrefetch, prefetchUrl } = await import('./prefetch');

    installLinkPrefetch();
    prefetchUrl('/cart.html');

    const cartLink = document.createElement('a');
    cartLink.href = '/cart.html';
    document.body.appendChild(cartLink);
    cartLink.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(document.head.querySelectorAll('link[rel="prefetch"]')).toHaveLength(0);
  });
});
