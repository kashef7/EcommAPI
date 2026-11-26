import type { ComponentChildren } from 'preact';
import styles from './Card.module.css';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  readonly as?: 'div' | 'article' | 'section';
  readonly padding?: CardPadding;
  readonly interactive?: boolean;
  readonly class?: string;
  readonly children: ComponentChildren;
}

export function Card({
  as: Tag = 'div',
  padding = 'md',
  interactive = false,
  class: className,
  children,
}: CardProps) {
  const classes = [
    styles.card,
    styles[`pad-${padding}`],
    interactive ? styles.interactive : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <Tag class={classes}>{children}</Tag>;
}
