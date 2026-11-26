import type { ComponentChildren } from 'preact';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { CircleAlert, RefreshCw } from '../Icon/icons';
import styles from './StateMessage.module.css';

export interface ErrorStateProps {
  readonly title?: string;
  readonly headingLevel?: 'h1' | 'h2';
  readonly message: string;
  readonly retryLabel?: string;
  readonly onRetry?: () => void;
  readonly retrying?: boolean;
  readonly action?: ComponentChildren;
  readonly class?: string;
}

export function ErrorState({
  title = 'Unable to load',
  headingLevel = 'h2',
  message,
  retryLabel = 'Try again',
  onRetry,
  retrying = false,
  action,
  class: className,
}: ErrorStateProps) {
  const HeadingTag = headingLevel;
  return (
    <section role="alert" class={`${styles.container}${className ? ` ${className}` : ''}`}>
      <div class={styles.iconWrap}>
        <Icon icon={CircleAlert} size={24} />
      </div>
      <HeadingTag class={styles.heading}>{title}</HeadingTag>
      <p class={styles.message}>{message}</p>
      {onRetry || action ? (
        <div class={styles.action}>
          {onRetry ? (
            <Button
              variant="secondary"
              loading={retrying}
              leadingIcon={<Icon icon={RefreshCw} size={16} />}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          ) : (
            action
          )}
        </div>
      ) : null}
    </section>
  );
}
