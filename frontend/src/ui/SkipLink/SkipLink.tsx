import type { ComponentChildren } from 'preact';
import styles from './SkipLink.module.css';

export interface SkipLinkProps {
  readonly href?: string;
  readonly children?: ComponentChildren;
}

export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a class={styles.skipLink} href={href}>
      {children}
    </a>
  );
}
