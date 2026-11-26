const DEFAULT_FALLBACK_PATH = '/index.html';
const DUMMY_ORIGIN = 'https://royal-market.invalid';

function containsControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

export function sanitizeRedirect(
  rawNext: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK_PATH,
): string {
  if (!rawNext || typeof rawNext !== 'string') {
    return fallback;
  }

  const candidate = rawNext.trim();
  if (candidate.length === 0 || containsControlChars(candidate)) {
    return fallback;
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback;
  }

  let decoded = candidate;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    containsControlChars(decoded)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, DUMMY_ORIGIN);
    if (parsed.origin !== DUMMY_ORIGIN) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
