interface NetworkConnectionLike {
  readonly saveData?: boolean;
}

function isSaveDataEnabled(): boolean {
  const nav = navigator as Navigator & { readonly connection?: NetworkConnectionLike };
  return Boolean(nav.connection?.saveData);
}

const prefetchedUrls = new Set<string>();
let prefetchInstalled = false;

function resolvePrefetchHref(anchor: HTMLAnchorElement): string | null {
  const rawHref = anchor.getAttribute('href');
  if (
    !rawHref ||
    rawHref.startsWith('#') ||
    rawHref.startsWith('mailto:') ||
    rawHref.startsWith('tel:')
  ) {
    return null;
  }
  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) {
      return null;
    }
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return null;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function prefetchUrl(relativeUrl: string): void {
  if (typeof document === 'undefined' || isSaveDataEnabled() || prefetchedUrls.has(relativeUrl)) {
    return;
  }
  prefetchedUrls.add(relativeUrl);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = relativeUrl;
  document.head.appendChild(link);
}

export function installLinkPrefetch(): void {
  if (prefetchInstalled || typeof document === 'undefined' || isSaveDataEnabled()) {
    return;
  }
  prefetchInstalled = true;

  function maybePrefetchFromTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const resolved = resolvePrefetchHref(anchor);
    if (resolved) {
      prefetchUrl(resolved);
    }
  }

  document.addEventListener('pointerenter', (e) => maybePrefetchFromTarget(e.target), {
    capture: true,
    passive: true,
  });
  document.addEventListener('focusin', (e) => maybePrefetchFromTarget(e.target), {
    passive: true,
  });
  document.addEventListener('touchstart', (e) => maybePrefetchFromTarget(e.target), {
    capture: true,
    passive: true,
  });
}
