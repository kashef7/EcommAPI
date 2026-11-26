import { useState } from 'preact/hooks';
import { LIMITS } from '@/core/validation/validators';
import { Button } from '@/ui/Button/Button';
import { Chip } from '@/ui/Chip/Chip';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { Plus } from '@/ui/Icon/icons';
import { ADMIN_OPTIONS_COPY } from '../copy';
import { tryAddOptionValue } from '../model/option-validation';
import styles from './OptionValuesChipInput.module.css';

export interface OptionValuesChipInputProps {
  readonly values: readonly string[];
  readonly error?: string;
  readonly disabled?: boolean;
  readonly onChange: (nextValues: readonly string[]) => void;
}

export function OptionValuesChipInput({
  values,
  error,
  disabled = false,
  onChange,
}: OptionValuesChipInputProps) {
  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  function addRawValue(raw: string) {
    const result = tryAddOptionValue(values, raw);
    if (!result.ok) {
      if (result.error) {
        setLocalError(result.error);
      }
      return;
    }
    setLocalError(undefined);
    setDraft('');
    onChange(result.values);
  }

  function handleInput(nextText: string) {
    if (localError) {
      setLocalError(undefined);
    }
    if (!nextText.includes(',')) {
      setDraft(nextText);
      return;
    }

    const parts = nextText.split(',');
    const trailing = parts.pop() ?? '';
    let nextValues = values;
    let firstErr: string | undefined;

    for (const part of parts) {
      if (part.trim().length === 0) continue;
      const result = tryAddOptionValue(nextValues, part);
      nextValues = result.values;
      if (!result.ok && result.error && !firstErr) {
        firstErr = result.error;
      }
    }

    if (nextValues !== values) {
      onChange(nextValues);
    }
    setLocalError(firstErr);
    setDraft(trailing);
  }

  const combinedError = localError ?? error;

  return (
    <div class={styles.wrapper}>
      <FormField
        label={ADMIN_OPTIONS_COPY.optionValuesLabel}
        hint={ADMIN_OPTIONS_COPY.optionValuesHint}
        {...(combinedError ? { error: combinedError } : {})}
        required
      >
        {(a11yProps) => (
          <div class={styles.inputRow}>
            <div class={styles.inputWrap}>
              <Input
                {...a11yProps}
                type="text"
                maxLength={LIMITS.optionValueMax}
                placeholder={ADMIN_OPTIONS_COPY.optionValuePlaceholder}
                value={draft}
                disabled={disabled}
                onInput={(event) => handleInput(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addRawValue(draft);
                  }
                }}
              />
            </div>
            <Button
              variant="secondary"
              disabled={disabled || draft.trim().length === 0}
              leadingIcon={<Icon icon={Plus} size={16} />}
              onClick={() => addRawValue(draft)}
            >
              {ADMIN_OPTIONS_COPY.optionValueAddButton}
            </Button>
          </div>
        )}
      </FormField>

      {values.length > 0 ? (
        <div class={styles.chipsWrap}>
          {values.map((val) => (
            <Chip
              key={val}
              disabled={disabled}
              removeLabel={ADMIN_OPTIONS_COPY.removeValueAria(val)}
              onRemove={() => {
                setLocalError(undefined);
                onChange(values.filter((item) => item !== val));
              }}
            >
              {val}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
