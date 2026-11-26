import type { JSX, Ref } from 'preact';
import styles from './Form.module.css';

export interface InputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'ref'> {
  readonly invalid?: boolean;
  readonly inputRef?: Ref<HTMLInputElement>;
}

export function Input({ invalid = false, inputRef, class: className, ...rest }: InputProps) {
  const isInvalid = invalid || rest['aria-invalid'] === 'true' || rest['aria-invalid'] === true;
  const classes = [
    styles.control,
    isInvalid ? styles.invalid : '',
    typeof className === 'string' ? className : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <input
      {...(inputRef ? { ref: inputRef } : {})}
      {...rest}
      aria-invalid={isInvalid ? 'true' : rest['aria-invalid']}
      class={classes}
    />
  );
}
