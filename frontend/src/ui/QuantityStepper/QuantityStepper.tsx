import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { IconButton } from '../Button/IconButton';
import { Icon } from '../Icon/Icon';
import { Minus, Plus } from '../Icon/icons';
import styles from './QuantityStepper.module.css';

export interface QuantityStepperProps {
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly onChange: (nextValue: number) => void;
  readonly class?: string;
}

function clampValue(raw: number, min: number, max?: number): number {
  const lowerBounded = Math.max(min, raw);
  return max !== undefined ? Math.min(max, lowerBounded) : lowerBounded;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  label = 'Quantity',
  disabled = false,
  onChange,
  class: className,
}: QuantityStepperProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && (max === undefined || value < max);

  function commitDraft(rawText: string) {
    const trimmed = rawText.trim();
    if (!/^\d+$/.test(trimmed)) {
      setDraft(String(value));
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    const next = clampValue(parsed, min, max);
    setDraft(String(next));
    if (next !== value) {
      onChange(next);
    }
  }

  function handleKeyDown(event: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitDraft(draft);
    } else if (event.key === 'ArrowUp' && canIncrease) {
      event.preventDefault();
      onChange(clampValue(value + 1, min, max));
    } else if (event.key === 'ArrowDown' && canDecrease) {
      event.preventDefault();
      onChange(clampValue(value - 1, min, max));
    }
  }

  return (
    <div class={`${styles.stepper}${className ? ` ${className}` : ''}`}>
      <IconButton
        label="Decrease quantity"
        variant="quiet"
        disabled={!canDecrease}
        class={styles.stepBtn}
        onClick={() => {
          if (canDecrease) {
            onChange(clampValue(value - 1, min, max));
          }
        }}
      >
        <Icon icon={Minus} size={16} />
      </IconButton>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        disabled={disabled}
        value={draft}
        class={`rm-tabular ${styles.valueInput}`}
        onInput={(event) => setDraft(event.currentTarget.value)}
        onBlur={() => commitDraft(draft)}
        onKeyDown={handleKeyDown}
      />

      <IconButton
        label="Increase quantity"
        variant="quiet"
        disabled={!canIncrease}
        class={styles.stepBtn}
        onClick={() => {
          if (canIncrease) {
            onChange(clampValue(value + 1, min, max));
          }
        }}
      >
        <Icon icon={Plus} size={16} />
      </IconButton>
    </div>
  );
}
