import type { ComponentChildren } from 'preact';
import styles from './Badge.module.css';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly icon?: ComponentChildren;
  readonly class?: string;
  readonly children: ComponentChildren;
}

export function Badge({ variant = 'neutral', icon, class: className, children }: BadgeProps) {
  return (
    <span class={`${styles.badge} ${styles[variant]}${className ? ` ${className}` : ''}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
