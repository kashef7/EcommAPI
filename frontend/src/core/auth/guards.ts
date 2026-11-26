import { getCurrentRelativeUrl, routes } from '@/core/navigation/routes';
import { setFlashToast } from '@/core/storage/safe-storage';
import { type SessionState, sessionState } from './session';

export type PageAuthMode = 'public' | 'guest-only' | 'authenticated' | 'admin';

export type PageAccessDecision =
  | { readonly status: 'loading' }
  | { readonly status: 'allowed' }
  | {
      readonly status: 'redirect';
      readonly to: string;
      readonly flashError?: string;
    };

export interface PageAccessOptions {
  readonly guestRedirectTo?: string;
}

export function resolvePageAccess(
  mode: PageAuthMode,
  current: SessionState,
  options: PageAccessOptions = {},
): PageAccessDecision {
  if (mode === 'public') {
    return { status: 'allowed' };
  }

  if (current.status === 'unknown') {
    return { status: 'loading' };
  }

  if (mode === 'guest-only') {
    if (current.status === 'authenticated') {
      return { status: 'redirect', to: options.guestRedirectTo ?? routes.home() };
    }
    return { status: 'allowed' };
  }

  if (current.status === 'anonymous') {
    return { status: 'redirect', to: routes.login(getCurrentRelativeUrl()) };
  }

  if (mode === 'admin' && !current.isAdmin) {
    return {
      status: 'redirect',
      to: routes.home(),
      flashError: 'You do not have access to that page.',
    };
  }

  return { status: 'allowed' };
}

export function applyPageAccessRedirect(
  decision: Extract<PageAccessDecision, { readonly status: 'redirect' }>,
): void {
  if (decision.flashError) {
    setFlashToast({
      variant: 'error',
      message: decision.flashError,
    });
  }
  window.location.replace(decision.to);
}

export function evaluatePageAccess(
  mode: PageAuthMode,
  options: PageAccessOptions = {},
): 'loading' | 'allowed' | 'redirecting' {
  const decision = resolvePageAccess(mode, sessionState.value, options);
  if (decision.status === 'redirect') {
    applyPageAccessRedirect(decision);
    return 'redirecting';
  }
  return decision.status;
}
