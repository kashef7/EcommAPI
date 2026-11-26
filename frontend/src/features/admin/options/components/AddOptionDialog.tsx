import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { LIMITS, setFieldError } from '@/core/validation/validators';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { Dialog } from '@/ui/Dialog/Dialog';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Select } from '@/ui/Form/Select';
import { ADMIN_OPTIONS_COPY } from '../copy';
import {
  type AddOptionDialogFieldKey,
  type AddOptionDialogResult,
  type AddOptionSubmitPayload,
  validateAddOptionDialog,
} from '../model/option-validation';
import styles from './AddOptionDialog.module.css';
import { OptionValuesChipInput } from './OptionValuesChipInput';

export interface AddOptionDialogProps {
  readonly open: boolean;
  readonly existingOptionNames: readonly string[];
  readonly existingVariantsCount: number;
  readonly submitting: boolean;
  readonly onSubmit: (payload: AddOptionSubmitPayload) => Promise<AddOptionDialogResult>;
  readonly onClose: () => void;
}

export function AddOptionDialog({
  open,
  existingOptionNames,
  existingVariantsCount,
  submitting,
  onSubmit,
  onClose,
}: AddOptionDialogProps) {
  const [name, setName] = useState('');
  const [values, setValues] = useState<readonly string[]>([]);
  const [existingVariantsValue, setExistingVariantsValue] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AddOptionDialogFieldKey, string>>>(
    {},
  );
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const existingValueSelectRef = useRef<HTMLSelectElement | null>(null);
  const requiresExistingValue = existingVariantsCount > 0;

  useEffect(() => {
    if (open) {
      setName('');
      setValues([]);
      setExistingVariantsValue('');
      setFieldErrors({});
      setFormErrors([]);
    }
  }, [open]);

  function handleValuesChange(nextValues: readonly string[]) {
    setValues(nextValues);
    if (
      existingVariantsValue &&
      !nextValues.some((val) => val.toLowerCase() === existingVariantsValue.toLowerCase())
    ) {
      setExistingVariantsValue('');
    }
    if (fieldErrors.values) {
      setFieldErrors((prev) => setFieldError(prev, 'values', undefined));
    }
  }

  async function handleFormSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const errors = validateAddOptionDialog(
      { name, values, existingVariantsValue },
      existingOptionNames,
      requiresExistingValue,
    );
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormErrors([]);
      if (errors.name) {
        nameInputRef.current?.focus();
      } else if (errors.existingVariantsValue && !errors.values) {
        existingValueSelectRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    setFormErrors([]);

    const payload: AddOptionSubmitPayload = {
      name: name.trim(),
      values,
      ...(requiresExistingValue ? { existingVariantsValue: existingVariantsValue.trim() } : {}),
    };

    const result = await onSubmit(payload);
    if (!result.ok) {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      if (result.formErrors) {
        setFormErrors(result.formErrors);
      }
    }
  }

  const formId = 'admin-add-option-form';

  return (
    <Dialog
      open={open}
      title={ADMIN_OPTIONS_COPY.edit.dialogTitle}
      size="md"
      initialFocusRef={nameInputRef}
      onClose={() => {
        if (!submitting) onClose();
      }}
      footer={
        <div class={styles.footerRow}>
          <Button variant="secondary" disabled={submitting} onClick={onClose}>
            {ADMIN_OPTIONS_COPY.edit.cancelDialogLabel}
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={submitting}>
            {submitting
              ? ADMIN_OPTIONS_COPY.edit.dialogSubmittingLabel
              : ADMIN_OPTIONS_COPY.edit.dialogSubmitLabel}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        class={styles.form}
        noValidate
        onSubmit={(event) => {
          void handleFormSubmit(event);
        }}
      >
        {formErrors.length > 0 ? (
          <Banner variant="danger" title={ADMIN_OPTIONS_COPY.edit.dialogErrorSummaryTitle}>
            {formErrors.length === 1 ? (
              <span>{formErrors[0]}</span>
            ) : (
              <ul class={styles.errorList}>
                {formErrors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            )}
          </Banner>
        ) : null}

        <FormField
          label={ADMIN_OPTIONS_COPY.optionNameLabel}
          {...(fieldErrors.name ? { error: fieldErrors.name } : {})}
          required
        >
          <Input
            type="text"
            name="optionName"
            maxLength={LIMITS.optionNameMax}
            placeholder={ADMIN_OPTIONS_COPY.optionNamePlaceholder}
            value={name}
            inputRef={nameInputRef}
            disabled={submitting}
            onInput={(event) => {
              setName(event.currentTarget.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => setFieldError(prev, 'name', undefined));
              }
            }}
          />
        </FormField>

        <OptionValuesChipInput
          values={values}
          {...(fieldErrors.values ? { error: fieldErrors.values } : {})}
          disabled={submitting}
          onChange={handleValuesChange}
        />

        {requiresExistingValue ? (
          <FormField
            label={ADMIN_OPTIONS_COPY.edit.dialogExistingValueLabel}
            hint={ADMIN_OPTIONS_COPY.edit.dialogExistingValueHelper}
            {...(fieldErrors.existingVariantsValue
              ? { error: fieldErrors.existingVariantsValue }
              : {})}
            required
          >
            <Select
              name="existingVariantsValue"
              selectRef={existingValueSelectRef}
              value={existingVariantsValue}
              disabled={submitting || values.length === 0}
              onChange={(event) => {
                setExistingVariantsValue(event.currentTarget.value);
                if (fieldErrors.existingVariantsValue) {
                  setFieldErrors((prev) => setFieldError(prev, 'existingVariantsValue', undefined));
                }
              }}
            >
              <option value="">{ADMIN_OPTIONS_COPY.edit.dialogExistingValuePlaceholder}</option>
              {values.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
      </form>
    </Dialog>
  );
}
