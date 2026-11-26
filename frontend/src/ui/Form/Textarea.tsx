import type { JSX, Ref } from 'preact';
import styles from './Form.module.css';

export interface TextareaProps extends Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'ref'
> {
  readonly invalid?: boolean;
  readonly textareaRef?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  invalid = false,
  textareaRef,
  class: className,
  ...rest
}: TextareaProps) {
  const isInvalid = invalid || rest['aria-invalid'] === 'true' || rest['aria-invalid'] === true;
  const classes = [
    styles.control,
    styles.textarea,
    isInvalid ? styles.invalid : '',
    typeof className === 'string' ? className : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <textarea
      {...(textareaRef ? { ref: textareaRef } : {})}
      {...rest}
      aria-invalid={isInvalid ? 'true' : rest['aria-invalid']}
      class={classes}
    />
  );
}
