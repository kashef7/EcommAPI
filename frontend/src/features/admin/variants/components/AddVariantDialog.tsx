import type { JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  LIMITS,
  setFieldError,
  validatePriceValue,
  validateStockValue,
} from '@/core/validation/validators';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { Dialog } from '@/ui/Dialog/Dialog';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Select } from '@/ui/Form/Select';
import { ADMIN_VARIANTS_COPY } from '../copy';
import {
  type AddVariantDialogFieldKey,
  type AddVariantDialogResult,
  type AddVariantSubmitPayload,
  type AdminVariantModel,
  type AdminVariantOptionModel,
  hasVariantWithCombination,
} from '../model/variant-combinations';
import styles from './AddVariantDialog.module.css';

export interface AddVariantDialogProps {
  readonly open: boolean;
  readonly options: readonly AdminVariantOptionModel[];
  readonly existingVariants: readonly AdminVariantModel[];
  readonly submitting: boolean;
  readonly onSubmit: (payload: AddVariantSubmitPayload) => Promise<AddVariantDialogResult>;
  readonly onClose: () => void;
}

type DialogFieldKey = AddVariantDialogFieldKey;

export function AddVariantDialog({
  open,
  options,
  existingVariants,
  submitting,
  onSubmit,
  onClose,
}: AddVariantDialogProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DialogFieldKey, string>>>({});
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);

  const priceInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      const initialSelections: Record<string, string> = {};
      for (const opt of options) {
        const firstVal = opt.values[0]?.value ?? '';
        initialSelections[opt.name] = firstVal;
      }
      setSelectedOptions(initialSelections);
      setPrice('');
      setStockQuantity('0');
      setFieldErrors({});
      setFormErrors([]);
    }
  }, [open, options]);

  const isDuplicateCombination = useMemo(() => {
    if (options.length === 0) {
      return false;
    }
    return hasVariantWithCombination(existingVariants, selectedOptions);
  }, [options.length, existingVariants, selectedOptions]);

  const isSingleNoOptionsBlocked = options.length === 0 && existingVariants.length > 0;

  async function handleFormSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || isDuplicateCombination) {
      return;
    }

    const nextErrors: Partial<Record<DialogFieldKey, string>> = {};
    const priceErr = validatePriceValue(price);
    if (priceErr) nextErrors.price = priceErr;

    const stockErr = validateStockValue(stockQuantity);
    if (stockErr) nextErrors.stockQuantity = stockErr;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormErrors([]);
      if (nextErrors.price) priceInputRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setFormErrors([]);

    const payload: AddVariantSubmitPayload = {
      ...(options.length > 0 ? { optionValues: selectedOptions } : {}),
      price: Number(price.trim()),
      stockQuantity: Number.parseInt(stockQuantity.trim(), 10),
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

  const formId = 'admin-add-variant-form';

  return (
    <Dialog
      open={open}
      title={ADMIN_VARIANTS_COPY.edit.addDialogTitle}
      size="md"
      initialFocusRef={priceInputRef}
      onClose={() => {
        if (!submitting) onClose();
      }}
      footer={
        <div class={styles.footerRow}>
          <Button variant="secondary" disabled={submitting} onClick={onClose}>
            {ADMIN_VARIANTS_COPY.edit.addDialogCancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            loading={submitting}
            disabled={isDuplicateCombination}
          >
            {submitting
              ? ADMIN_VARIANTS_COPY.edit.addDialogSubmitting
              : ADMIN_VARIANTS_COPY.edit.addDialogSubmit}
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
          <Banner variant="danger" title={ADMIN_VARIANTS_COPY.edit.addDialogErrorSummaryTitle}>
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

        {isDuplicateCombination ? (
          <Banner variant="warning">{ADMIN_VARIANTS_COPY.edit.addDialogDuplicateWarning}</Banner>
        ) : null}

        {isSingleNoOptionsBlocked ? (
          <Banner variant="info">{ADMIN_VARIANTS_COPY.edit.addDialogSingleNote}</Banner>
        ) : null}

        {options.map((option) => (
          <FormField key={option.id} label={option.name} required>
            <Select
              name={`option-${option.id}`}
              value={selectedOptions[option.name] ?? ''}
              disabled={submitting}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setSelectedOptions((prev) => ({ ...prev, [option.name]: value }));
              }}
            >
              {option.values.map((val) => (
                <option key={val.id} value={val.value}>
                  {val.value}
                </option>
              ))}
            </Select>
          </FormField>
        ))}

        <div class={styles.pairGrid}>
          <FormField
            label={ADMIN_VARIANTS_COPY.priceLabel}
            {...(fieldErrors.price ? { error: fieldErrors.price } : {})}
            required
          >
            <Input
              type="number"
              name="price"
              step="0.01"
              min={String(LIMITS.minPrice)}
              max={String(LIMITS.maxPrice)}
              value={price}
              inputRef={priceInputRef}
              disabled={submitting}
              onInput={(event) => {
                setPrice(event.currentTarget.value);
                if (fieldErrors.price) {
                  setFieldErrors((prev) => setFieldError(prev, 'price', undefined));
                }
              }}
            />
          </FormField>

          <FormField
            label={ADMIN_VARIANTS_COPY.stockLabel}
            {...(fieldErrors.stockQuantity ? { error: fieldErrors.stockQuantity } : {})}
            required
          >
            <Input
              type="number"
              name="stockQuantity"
              step="1"
              min={String(LIMITS.minStock)}
              max={String(LIMITS.maxStock)}
              value={stockQuantity}
              disabled={submitting}
              onInput={(event) => {
                setStockQuantity(event.currentTarget.value);
                if (fieldErrors.stockQuantity) {
                  setFieldErrors((prev) => setFieldError(prev, 'stockQuantity', undefined));
                }
              }}
            />
          </FormField>
        </div>
      </form>
    </Dialog>
  );
}
