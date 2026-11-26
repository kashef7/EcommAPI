import { useEffect } from 'preact/hooks';
import {
  applyPageAccessRedirect,
  type PageAccessOptions,
  type PageAuthMode,
  resolvePageAccess,
} from './guards';
import { sessionState } from './session';

export interface UsePageAccessOptions extends PageAccessOptions {
  readonly enabled?: boolean;
}

export function usePageAccess(
  mode: PageAuthMode,
  options: UsePageAccessOptions = {},
): 'loading' | 'allowed' | 'redirecting' {
  const { enabled = true, guestRedirectTo } = options;
  const current = sessionState.value;
  const decision = resolvePageAccess(
    mode,
    current,
    guestRedirectTo ? { guestRedirectTo } : undefined,
  );

  useEffect(() => {
    if (!enabled || decision.status !== 'redirect') {
      return;
    }
    applyPageAccessRedirect(decision);
  }, [enabled, decision]);

  return decision.status === 'redirect' ? 'redirecting' : decision.status;
}
