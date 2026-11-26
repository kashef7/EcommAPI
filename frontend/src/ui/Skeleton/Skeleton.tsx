import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'title' | 'image' | 'block';
export type SkeletonTone = 'default' | 'chrome';

export interface SkeletonProps {
  readonly variant?: SkeletonVariant;
  readonly tone?: SkeletonTone;
  readonly width?: string;
  readonly height?: string;
  readonly class?: string;
}

export function Skeleton({
  variant = 'text',
  tone = 'default',
  width,
  height,
  class: className,
}: SkeletonProps) {
  const inlineSize =
    width || height ? { ...(width ? { width } : {}), ...(height ? { height } : {}) } : undefined;
  const classes = [
    styles.skeleton,
    styles[variant],
    tone === 'chrome' ? styles.chrome : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <span aria-hidden="true" class={classes} style={inlineSize} />;
}
