import type { ComponentChildren, JSX, Ref } from 'preact';
import { Spinner } from '../Spinner/Spinner';
import styles from './Button.module.css';

export type IconButtonVariant = 'quiet' | 'secondary' | 'danger' | 'primary';

export interface IconButtonProps {
  readonly label: string;
  readonly variant?: IconButtonVariant;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly ariaDisabled?: boolean;
  readonly ariaExpanded?: boolean | undefined;
  readonly ariaHaspopup?: 'menu' | 'dialog' | 'listbox' | 'true' | undefined;
  readonly ariaControls?: string | undefined;
  readonly ariaPressed?: boolean | undefined;
  readonly buttonRef?: Ref<HTMLButtonElement> | undefined;
  readonly class?: string | undefined;
  readonly onClick?: ((event: JSX.TargetedMouseEvent<HTMLButtonElement>) => void) | undefined;
  readonly children: ComponentChildren;
}

export function IconButton({
  label,
  variant = 'quiet',
  type = 'button',
  loading = false,
  disabled = false,
  ariaDisabled = false,
  ariaExpanded,
  ariaHaspopup,
  ariaControls,
  ariaPressed,
  buttonRef,
  class: className,
  onClick,
  children,
}: IconButtonProps) {
  const isInert = disabled || loading || ariaDisabled;
  const classes = [
    styles.iconButton,
    styles[variant],
    isInert ? styles.isDisabled : '',
    loading ? styles.isLoading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  function handleClick(event: JSX.TargetedMouseEvent<HTMLButtonElement>) {
    if (isInert) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...(buttonRef ? { ref: buttonRef } : {})}
      type={type}
      aria-label={label}
      disabled={disabled}
      aria-disabled={isInert ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      aria-expanded={ariaExpanded !== undefined ? (ariaExpanded ? 'true' : 'false') : undefined}
      aria-haspopup={ariaHaspopup}
      aria-controls={ariaControls}
      aria-pressed={ariaPressed !== undefined ? (ariaPressed ? 'true' : 'false') : undefined}
      class={classes}
      onClick={handleClick}
    >
      {loading ? <Spinner size={16} /> : children}
    </button>
  );
}
