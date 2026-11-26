import type { RefObject } from 'preact';
import { useState } from 'preact/hooks';
import { LIMITS, validatePriceValue, validateStockValue } from '@/core/validation/validators';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { RefreshCw, Trash2 } from '@/ui/Icon/icons';
import { ADMIN_VARIANTS_COPY } from '../copy';
import type { VariantDraftRow } from '../model/variant-combinations';
import styles from './CreateVariantsSection.module.css';

export interface VariantRowError {
  readonly price?: string;
  readonly stockQuantity?: string;
}

export interface CreateVariantsSectionProps {
  readonly hasOptions: boolean;
  readonly singleVariant: { readonly price: string; readonly stockQuantity: string };
  readonly singleVariantError?: VariantRowError;
  readonly variants: readonly VariantDraftRow[];
  readonly variantErrors: Readonly<Record<number, VariantRowError>>;
  readonly sectionError?: string;
  readonly disabled?: boolean;
  readonly generateButtonRef?: RefObject<HTMLButtonElement>;
  readonly onSingleChange: (field: 'price' | 'stockQuantity', value: string) => void;
  readonly onBlurSingle?: (field: 'price' | 'stockQuantity') => void;
  readonly onGenerate: () => void;
  readonly onVariantChange: (
    index: number,
    field: 'price' | 'stockQuantity',
    value: string,
  ) => void;
  readonly onBlurVariant?: (index: number, field: 'price' | 'stockQuantity') => void;
  readonly onRemoveVariant: (index: number) => void;
  readonly onApplyPriceToAll: (price: string) => void;
  readonly onApplyStockToAll: (stockQuantity: string) => void;
}

export function CreateVariantsSection({
  hasOptions,
  singleVariant,
  singleVariantError,
  variants,
  variantErrors,
  sectionError,
  disabled = false,
  generateButtonRef,
  onSingleChange,
  onBlurSingle,
  onGenerate,
  onVariantChange,
  onBlurVariant,
  onRemoveVariant,
  onApplyPriceToAll,
  onApplyStockToAll,
}: CreateVariantsSectionProps) {
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkPriceError, setBulkPriceError] = useState<string | undefined>(undefined);
  const [bulkStock, setBulkStock] = useState('');
  const [bulkStockError, setBulkStockError] = useState<string | undefined>(undefined);

  function handleApplyPrice() {
    const err = validatePriceValue(bulkPrice);
    if (err) {
      setBulkPriceError(err);
      return;
    }
    setBulkPriceError(undefined);
    onApplyPriceToAll(bulkPrice.trim());
  }

  function handleApplyStock() {
    const err = validateStockValue(bulkStock);
    if (err) {
      setBulkStockError(err);
      return;
    }
    setBulkStockError(undefined);
    onApplyStockToAll(bulkStock.trim());
  }

  return (
    <div class={styles.stack}>
      <div class={styles.headerRow}>
        <h2>{ADMIN_VARIANTS_COPY.heading}</h2>
        {hasOptions ? (
          <Button
            variant="secondary"
            disabled={disabled}
            {...(generateButtonRef ? { buttonRef: generateButtonRef } : {})}
            leadingIcon={<Icon icon={RefreshCw} size={16} />}
            onClick={onGenerate}
          >
            {ADMIN_VARIANTS_COPY.generateButton}
          </Button>
        ) : null}
      </div>

      {sectionError ? <Banner variant="danger">{sectionError}</Banner> : null}

      {!hasOptions ? (
        <>
          <p class={styles.singleNote}>{ADMIN_VARIANTS_COPY.singleVersionIntro}</p>
          <div class={styles.pairGrid}>
            <FormField
              label={ADMIN_VARIANTS_COPY.priceLabel}
              {...(singleVariantError?.price ? { error: singleVariantError.price } : {})}
              required
            >
              <Input
                type="number"
                name="variants[0].price"
                step="0.01"
                min={String(LIMITS.minPrice)}
                max={String(LIMITS.maxPrice)}
                value={singleVariant.price}
                disabled={disabled}
                onInput={(event) => onSingleChange('price', event.currentTarget.value)}
                onBlur={() => onBlurSingle?.('price')}
              />
            </FormField>

            <FormField
              label={ADMIN_VARIANTS_COPY.stockLabel}
              {...(singleVariantError?.stockQuantity
                ? { error: singleVariantError.stockQuantity }
                : {})}
              required
            >
              <Input
                type="number"
                name="variants[0].stockQuantity"
                step="1"
                min={String(LIMITS.minStock)}
                max={String(LIMITS.maxStock)}
                value={singleVariant.stockQuantity}
                disabled={disabled}
                onInput={(event) => onSingleChange('stockQuantity', event.currentTarget.value)}
                onBlur={() => onBlurSingle?.('stockQuantity')}
              />
            </FormField>
          </div>
        </>
      ) : variants.length === 0 ? (
        <p class={styles.emptyNote}>{ADMIN_VARIANTS_COPY.noVariantsYet}</p>
      ) : (
        <>
          <div class={styles.bulkBar}>
            <div class={styles.bulkGroup}>
              <div class={styles.bulkInputWrap}>
                <FormField
                  label={ADMIN_VARIANTS_COPY.applyPriceLabel}
                  {...(bulkPriceError ? { error: bulkPriceError } : {})}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min={String(LIMITS.minPrice)}
                    max={String(LIMITS.maxPrice)}
                    value={bulkPrice}
                    disabled={disabled}
                    onInput={(event) => {
                      setBulkPrice(event.currentTarget.value);
                      if (bulkPriceError) setBulkPriceError(undefined);
                    }}
                  />
                </FormField>
              </div>
              <Button variant="secondary" disabled={disabled} onClick={handleApplyPrice}>
                {ADMIN_VARIANTS_COPY.applyPriceButton}
              </Button>
            </div>

            <div class={styles.bulkGroup}>
              <div class={styles.bulkInputWrap}>
                <FormField
                  label={ADMIN_VARIANTS_COPY.applyStockLabel}
                  {...(bulkStockError ? { error: bulkStockError } : {})}
                >
                  <Input
                    type="number"
                    step="1"
                    min={String(LIMITS.minStock)}
                    max={String(LIMITS.maxStock)}
                    value={bulkStock}
                    disabled={disabled}
                    onInput={(event) => {
                      setBulkStock(event.currentTarget.value);
                      if (bulkStockError) setBulkStockError(undefined);
                    }}
                  />
                </FormField>
              </div>
              <Button variant="secondary" disabled={disabled} onClick={handleApplyStock}>
                {ADMIN_VARIANTS_COPY.applyStockButton}
              </Button>
            </div>
          </div>

          <div class={styles.tableWrap}>
            <table class={styles.table}>
              <caption>{ADMIN_VARIANTS_COPY.table.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{ADMIN_VARIANTS_COPY.table.variantColumn}</th>
                  <th scope="col">{ADMIN_VARIANTS_COPY.table.priceColumn}</th>
                  <th scope="col">{ADMIN_VARIANTS_COPY.table.stockColumn}</th>
                  <th scope="col">{ADMIN_VARIANTS_COPY.table.actionsColumn}</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((row, index) => {
                  const rowErr = variantErrors[index];
                  return (
                    <tr key={row.key} class={styles.row}>
                      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.variantColumn}>
                        <span class={styles.labelText}>{row.label}</span>
                      </td>

                      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.priceColumn}>
                        <FormField
                          label={ADMIN_VARIANTS_COPY.priceLabel}
                          {...(rowErr?.price ? { error: rowErr.price } : {})}
                          required
                        >
                          <Input
                            type="number"
                            name={`variants[${index}].price`}
                            step="0.01"
                            min={String(LIMITS.minPrice)}
                            max={String(LIMITS.maxPrice)}
                            value={row.price}
                            disabled={disabled}
                            onInput={(event) =>
                              onVariantChange(index, 'price', event.currentTarget.value)
                            }
                            onBlur={() => onBlurVariant?.(index, 'price')}
                          />
                        </FormField>
                      </td>

                      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.stockColumn}>
                        <FormField
                          label={ADMIN_VARIANTS_COPY.stockLabel}
                          {...(rowErr?.stockQuantity ? { error: rowErr.stockQuantity } : {})}
                          required
                        >
                          <Input
                            type="number"
                            name={`variants[${index}].stockQuantity`}
                            step="1"
                            min={String(LIMITS.minStock)}
                            max={String(LIMITS.maxStock)}
                            value={row.stockQuantity}
                            disabled={disabled}
                            onInput={(event) =>
                              onVariantChange(index, 'stockQuantity', event.currentTarget.value)
                            }
                            onBlur={() => onBlurVariant?.(index, 'stockQuantity')}
                          />
                        </FormField>
                      </td>

                      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.actionsColumn}>
                        <IconButton
                          label={ADMIN_VARIANTS_COPY.table.removeRowAria(row.label)}
                          variant="danger"
                          disabled={disabled}
                          onClick={() => onRemoveVariant(index)}
                        >
                          <Icon icon={Trash2} size={16} />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
