import { reportError } from './error-reporter';

let handlersInstalled = false;

export function installGlobalErrorHandlers(onUnhandledError?: () => void): void {
  if (handlersInstalled || typeof window === 'undefined') {
    return;
  }
  handlersInstalled = true;

  window.addEventListener('error', (event) => {
    reportError(event.error ?? new Error(event.message || 'Unhandled window error'), {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    onUnhandledError?.();
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason ?? new Error('Unhandled promise rejection'), {
      source: 'window.unhandledrejection',
    });
    onUnhandledError?.();
  });
}
