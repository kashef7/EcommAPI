import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import styles from './SegmentedOptionGroup.module.css';

export interface SegmentedOption {
  readonly value: string;
  readonly label: string;
  readonly available: boolean;
  readonly inStock: boolean;
}

export interface SegmentedOptionGroupProps {
  readonly label: string;
  readonly options: readonly SegmentedOption[];
  readonly value: string | null;
  readonly onChange: (value: string) => void;
  readonly class?: string;
}

export function SegmentedOptionGroup({
  label,
  options,
  value,
  onChange,
  class: className,
}: SegmentedOptionGroupProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  function handleKeyDown(index: number, event: JSX.TargetedKeyboardEvent<HTMLButtonElement>) {
    if (options.length === 0) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      buttonRefs.current[nextIndex]?.focus();
      const targetOption = options[nextIndex];
      if (targetOption?.available) {
        onChange(targetOption.value);
      }
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      class={`${styles.group}${className ? ` ${className}` : ''}`}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isSoldOut = option.available && !option.inStock;
        const isUnavailable = !option.available;
        const isTabStop = isSelected || (selectedIndex === -1 && index === 0);

        const classes = [
          styles.option,
          isSelected ? styles.selected : '',
          isSoldOut ? styles.soldOut : '',
          isUnavailable ? styles.unavailable : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected ? 'true' : 'false'}
            aria-disabled={isUnavailable || isSoldOut ? 'true' : undefined}
            tabIndex={isTabStop ? 0 : -1}
            class={classes}
            onClick={() => {
              if (option.available) {
                onChange(option.value);
              }
            }}
            onKeyDown={(event) => handleKeyDown(index, event)}
          >
            <span class={isSoldOut ? styles.strike : undefined}>{option.label}</span>
            {isSoldOut ? <span class={styles.hint}>Sold out</span> : null}
            {isUnavailable ? <span class={styles.hint}>Unavailable</span> : null}
          </button>
        );
      })}
    </div>
  );
}
