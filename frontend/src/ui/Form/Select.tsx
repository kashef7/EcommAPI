import type { ComponentChildren, JSX, Ref } from 'preact';
import { Icon } from '../Icon/Icon';
import { ChevronDown } from '../Icon/icons';
import styles from './Form.module.css';

export interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'ref'> {
  readonly invalid?: boolean;
  readonly selectRef?: Ref<HTMLSelectElement>;
  readonly children: ComponentChildren;
}

export function Select({
  invalid = false,
  selectRef,
  class: className,
  children,
  ...rest
}: SelectProps) {
  const isInvalid = invalid || rest['aria-invalid'] === 'true' || rest['aria-invalid'] === true;
  const classes = [
    styles.control,
    styles.select,
    isInvalid ? styles.invalid : '',
    typeof className === 'string' ? className : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={styles.selectWrap}>
      <select
        {...(selectRef ? { ref: selectRef } : {})}
        {...rest}
        aria-invalid={isInvalid ? 'true' : rest['aria-invalid']}
        class={classes}
      >
        {children}
      </select>
      <span class={styles.selectChevron} aria-hidden="true">
        <Icon icon={ChevronDown} size={16} />
      </span>
    </div>
  );
}
