import type { ComponentChildren, ComponentType } from 'preact';
import type { LucideProps } from 'lucide-preact';
import { Icon } from '../Icon/Icon';
import { PackageOpen } from '../Icon/icons';
import styles from './StateMessage.module.css';

export interface EmptyStateProps {
  readonly heading: string;
  readonly message?: string;
  readonly icon?: ComponentType<LucideProps>;
  readonly action?: ComponentChildren;
  readonly class?: string;
}

export function EmptyState({
  heading,
  message,
  icon = PackageOpen,
  action,
  class: className,
}: EmptyStateProps) {
  return (
    <section class={`${styles.container}${className ? ` ${className}` : ''}`}>
      <div class={styles.iconWrap}>
        <Icon icon={icon} size={24} />
      </div>
      <h2 class={styles.heading}>{heading}</h2>
      {message ? <p class={styles.message}>{message}</p> : null}
      {action ? <div class={styles.action}>{action}</div> : null}
    </section>
  );
}
