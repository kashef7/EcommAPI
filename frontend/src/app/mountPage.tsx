import '@/styles/index.css';
import { type ComponentType, render } from 'preact';
import { envValidation } from '@/config/env';
import { bootstrapSession, initAuthSync } from '@/core/auth/refresh';
import { installGlobalErrorHandlers } from '@/core/logging/global-handlers';
import { logger } from '@/core/logging/logger';
import { installLinkPrefetch } from '@/core/navigation/prefetch';
import { consumeFlashToast } from '@/core/storage/safe-storage';
import { initThemeSync } from '@/core/theme/theme';
import { ToastHost } from '@/ui/Toast/ToastHost';
import { showToast, toast } from '@/ui/Toast/toast-store';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './mountPage.module.css';

function ConfigErrorView({ errors }: { readonly errors: readonly string[] }) {
  return (
    <main class={`rm-container ${styles.configError}`}>
      <h1>Application configuration error</h1>
      <p class={styles.configErrorLead}>
        The application could not start because one or more configuration values are invalid.
      </p>
      <ul class={styles.configErrorList}>
        {errors.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </main>
  );
}

export function mountPage(Page: ComponentType): void {
  const root = document.getElementById('app');
  if (!root) {
    logger.error('Mount root element #app was not found.');
    return;
  }

  if (!envValidation.ok) {
    logger.error('Startup environment validation failed.', { errors: envValidation.errors });
    render(<ConfigErrorView errors={envValidation.errors} />, root);
    return;
  }

  initThemeSync();
  installGlobalErrorHandlers(() => {
    toast.error('Something went wrong. Please try again.');
  });
  installLinkPrefetch();
  initAuthSync();
  void bootstrapSession();

  const flash = consumeFlashToast();
  if (flash) {
    showToast({ variant: flash.variant, message: flash.message });
  }

  render(
    <ErrorBoundary>
      <Page />
      <ToastHost />
    </ErrorBoundary>,
    root,
  );
}
