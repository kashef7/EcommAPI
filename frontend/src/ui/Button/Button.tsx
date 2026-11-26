import type { ComponentChildren, JSX, Ref } from 'preact';
import { Spinner } from '../Spinner/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonStyleOptions {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly class?: string;
}

export function buttonClassNames({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  class: className,
}: ButtonStyleOptions = {}): string {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    disabled || loading ? styles.isDisabled : '',
    loading ? styles.isLoading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export interface ButtonProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly ariaDisabled?: boolean;
  readonly fullWidth?: boolean;
  readonly leadingIcon?: ComponentChildren;
  readonly trailingIcon?: ComponentChildren;
  readonly buttonRef?: Ref<HTMLButtonElement> | undefined;
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly ariaDescribedBy?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly ariaExpanded?: boolean | undefined;
  readonly ariaControls?: string | undefined;
  readonly class?: string | undefined;
  readonly onClick?: ((event: JSX.TargetedMouseEvent<HTMLButtonElement>) => void) | undefined;
  readonly children: ComponentChildren;
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  ariaDisabled = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  buttonRef,
  id,
  name,
  form,
  ariaDescribedBy,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  class: className,
  onClick,
  children,
}: ButtonProps) {
  const isInert = disabled || loading || ariaDisabled;
  const classes = buttonClassNames({
    variant,
    size,
    fullWidth,
    disabled: isInert,
    loading,
    ...(className ? { class: className } : {}),
  });

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
      id={id}
      name={name}
      form={form}
      type={type}
      disabled={disabled}
      aria-disabled={isInert ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded !== undefined ? (ariaExpanded ? 'true' : 'false') : undefined}
      aria-controls={ariaControls}
      class={classes}
      onClick={handleClick}
    >
      {loading ? <Spinner size={16} /> : leadingIcon}
      <span>{children}</span>
      {!loading ? trailingIcon : null}
    </button>
  );
}
