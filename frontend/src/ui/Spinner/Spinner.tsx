import type { IconSize } from '../Icon/Icon';
import { LoaderCircle } from '../Icon/icons';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  readonly size?: IconSize;
  readonly label?: string;
  readonly class?: string;
}

export function Spinner({ size = 20, label, class: className }: SpinnerProps) {
  const isStatus = Boolean(label);
  return (
    <span
      class={`${styles.spinner}${className ? ` ${className}` : ''}`}
      role={isStatus ? 'status' : undefined}
    >
      <LoaderCircle size={size} strokeWidth={1.75} class={styles.icon} aria-hidden="true" />
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </span>
  );
}
