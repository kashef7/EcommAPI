import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'title' | 'image' | 'block';

export interface SkeletonProps {
  readonly variant?: SkeletonVariant;
  readonly width?: string;
  readonly height?: string;
  readonly class?: string;
}

export function Skeleton({ variant = 'text', width, height, class: className }: SkeletonProps) {
  const inlineSize =
    width || height ? { ...(width ? { width } : {}), ...(height ? { height } : {}) } : undefined;
  return (
    <span
      aria-hidden="true"
      class={`${styles.skeleton} ${styles[variant]}${className ? ` ${className}` : ''}`}
      style={inlineSize}
    />
  );
}
