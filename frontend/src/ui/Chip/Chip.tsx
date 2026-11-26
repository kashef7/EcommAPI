import type { ComponentChildren } from 'preact';
import { Icon } from '../Icon/Icon';
import { X } from '../Icon/icons';
import styles from './Chip.module.css';

export interface ChipProps {
  readonly children: ComponentChildren;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly icon?: ComponentChildren;
  readonly class?: string;
}

export function Chip({
  children,
  selected = false,
  disabled = false,
  href,
  onClick,
  onRemove,
  removeLabel,
  icon,
  class: className,
}: ChipProps) {
  if (onRemove) {
    return (
      <span class={`${styles.staticChip}${className ? ` ${className}` : ''}`}>
        {icon}
        <span>{children}</span>
        <button
          type="button"
          class={styles.removeButton}
          aria-label={removeLabel ?? `Remove ${String(children)}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Icon icon={X} size={16} />
        </button>
      </span>
    );
  }

  const classes = [styles.chip, selected ? styles.selected : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <a class={classes} href={href}>
        {icon}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      class={classes}
      aria-pressed={selected ? 'true' : 'false'}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
