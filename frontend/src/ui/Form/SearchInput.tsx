import type { JSX, Ref } from 'preact';
import { IconButton } from '../Button/IconButton';
import { Icon } from '../Icon/Icon';
import { Search, X } from '../Icon/icons';
import styles from './Form.module.css';

export interface SearchInputProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'ref'
> {
  readonly value: string;
  readonly onClear?: () => void;
  readonly clearLabel?: string;
  readonly inputRef?: Ref<HTMLInputElement>;
}

export function SearchInput({
  value,
  onClear,
  clearLabel = 'Clear search',
  inputRef,
  class: className,
  disabled,
  ...rest
}: SearchInputProps) {
  const classes = [
    styles.control,
    styles.searchControl,
    typeof className === 'string' ? className : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={styles.inputGroup}>
      <span class={styles.leadingAdornment} aria-hidden="true">
        <Icon icon={Search} size={16} />
      </span>
      <input
        {...(inputRef ? { ref: inputRef } : {})}
        {...rest}
        type="search"
        value={value}
        disabled={disabled}
        class={classes}
      />
      {value.length > 0 && onClear ? (
        <IconButton
          label={clearLabel}
          variant="quiet"
          disabled={Boolean(disabled)}
          class={styles.trailingAction}
          onClick={onClear}
        >
          <Icon icon={X} size={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
