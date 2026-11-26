import type { JSX, Ref } from 'preact';
import { useState } from 'preact/hooks';
import { IconButton } from '../Button/IconButton';
import { Icon } from '../Icon/Icon';
import { Eye, EyeOff } from '../Icon/icons';
import styles from './Form.module.css';

export interface PasswordInputProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'ref'
> {
  readonly invalid?: boolean;
  readonly inputRef?: Ref<HTMLInputElement>;
}

export function PasswordInput({
  invalid = false,
  inputRef,
  class: className,
  disabled,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const isInvalid = invalid || rest['aria-invalid'] === 'true' || rest['aria-invalid'] === true;

  const classes = [
    styles.control,
    styles.passwordControl,
    isInvalid ? styles.invalid : '',
    typeof className === 'string' ? className : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={styles.inputGroup}>
      <input
        {...(inputRef ? { ref: inputRef } : {})}
        {...rest}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        aria-invalid={isInvalid ? 'true' : rest['aria-invalid']}
        class={classes}
      />
      <IconButton
        label={visible ? 'Hide password' : 'Show password'}
        variant="quiet"
        ariaPressed={visible}
        disabled={Boolean(disabled)}
        class={styles.trailingAction}
        onClick={() => setVisible((prev) => !prev)}
      >
        <Icon icon={visible ? EyeOff : Eye} size={16} />
      </IconButton>
    </div>
  );
}
