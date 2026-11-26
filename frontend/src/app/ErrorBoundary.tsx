import { Component, type ComponentChildren } from 'preact';
import { reportError } from '@/core/logging/error-reporter';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import styles from './mountPage.module.css';

interface ErrorBoundaryProps {
  readonly children: ComponentChildren;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static override getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    reportError(error, { source: 'ErrorBoundary' });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main class={`rm-container ${styles.configError}`}>
          <ErrorState
            title="Something went wrong"
            headingLevel="h1"
            message="This page ran into an unexpected problem. Reload the page to continue."
            retryLabel="Reload page"
            onRetry={() => window.location.reload()}
          />
        </main>
      );
    }

    return this.props.children;
  }
}
