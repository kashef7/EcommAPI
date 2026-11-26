import type { ComponentChildren, JSX, Ref } from 'preact';
import styles from './Form.module.css';

export interface CheckboxProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'ref'
> {
  readonly label: ComponentChildren;
  readonly inputRef?: Ref<HTMLInputElement>;
}

export function Checkbox({ label, inputRef, class: className, ...rest }: CheckboxProps) {
  return (
    <label class={`${styles.checkboxLabel}${typeof className === 'string' ? ` ${className}` : ''}`}>
      <span class={styles.checkboxBoxWrap}>
        <input
          {...(inputRef ? { ref: inputRef } : {})}
          type="checkbox"
          class={styles.checkboxInput}
          {...rest}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
