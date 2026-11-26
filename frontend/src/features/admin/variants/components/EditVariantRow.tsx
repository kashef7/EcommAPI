import { useEffect, useId, useState } from 'preact/hooks';
import { LIMITS, validatePositiveDelta, validatePriceValue } from '@/core/validation/validators';
import { Badge } from '@/ui/Badge/Badge';
import { Button } from '@/ui/Button/Button';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { Check, Minus, Plus, Trash2 } from '@/ui/Icon/icons';
import { ADMIN_VARIANTS_COPY } from '../copy';
import type { AdminVariantModel } from '../model/variant-combinations';
import styles from './EditVariantsSection.module.css';

export interface EditVariantRowProps {
  readonly variant: AdminVariantModel;
  readonly label: string;
  readonly isLastVariant: boolean;
  readonly busy: boolean;
  readonly onSavePrice: (variantId: string, price: number) => Promise<string | undefined>;
  readonly onAdjustStock: (variantId: string, delta: number) => Promise<string | undefined>;
  readonly onRequestDelete: (variant: AdminVariantModel, label: string) => void;
}

export function EditVariantRow({
  variant,
  label,
  isLastVariant,
  busy,
  onSavePrice,
  onAdjustStock,
  onRequestDelete,
}: EditVariantRowProps) {
  const [priceDraft, setPriceDraft] = useState(String(variant.price));
  const [priceError, setPriceError] = useState<string | undefined>(undefined);
  const [savingPrice, setSavingPrice] = useState(false);

  const [deltaDraft, setDeltaDraft] = useState('');
  const [stockError, setStockError] = useState<string | undefined>(undefined);
  const [adjustingMode, setAdjustingMode] = useState<'add' | 'remove' | null>(null);

  const lastVariantNoteId = useId();

  useEffect(() => {
    setPriceDraft(String(variant.price));
  }, [variant.price]);

  async function handlePriceSubmit() {
    if (savingPrice) return;
    const err = validatePriceValue(priceDraft);
    if (err) {
      setPriceError(err);
      return;
    }
    setPriceError(undefined);
    setSavingPrice(true);
    const serverErr = await onSavePrice(variant.id, Number(priceDraft.trim()));
    setSavingPrice(false);
    if (serverErr) {
      setPriceError(serverErr);
    }
  }

  async function handleStockAdjust(direction: 'add' | 'remove') {
    if (adjustingMode !== null) return;
    const err = validatePositiveDelta(deltaDraft);
    if (err) {
      setStockError(err);
      return;
    }
    setStockError(undefined);
    const amount = Number.parseInt(deltaDraft.trim(), 10);
    const signedDelta = direction === 'add' ? amount : -amount;

    setAdjustingMode(direction);
    const serverErr = await onAdjustStock(variant.id, signedDelta);
    setAdjustingMode(null);
    if (serverErr) {
      setStockError(serverErr);
      return;
    }
    setDeltaDraft('');
  }

  return (
    <tr class={styles.row}>
      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.variantColumn}>
        <span class={styles.labelText}>{label}</span>
      </td>

      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.priceColumn}>
        <form
          class={styles.priceForm}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handlePriceSubmit();
          }}
        >
          <div class={styles.priceInputWrap}>
            <FormField
              label={ADMIN_VARIANTS_COPY.edit.priceInputAria(label)}
              {...(priceError ? { error: priceError } : {})}
            >
              <Input
                type="number"
                step="0.01"
                min={String(LIMITS.minPrice)}
                max={String(LIMITS.maxPrice)}
                value={priceDraft}
                disabled={busy || savingPrice}
                onInput={(event) => {
                  setPriceDraft(event.currentTarget.value);
                  if (priceError) setPriceError(undefined);
                }}
              />
            </FormField>
          </div>
          <Button
            type="submit"
            variant="secondary"
            ariaLabel={ADMIN_VARIANTS_COPY.edit.savePriceAria(label)}
            loading={savingPrice}
            disabled={busy}
            leadingIcon={<Icon icon={Check} size={16} />}
          >
            {savingPrice
              ? ADMIN_VARIANTS_COPY.edit.savingPriceButton
              : ADMIN_VARIANTS_COPY.edit.savePriceButton}
          </Button>
        </form>
      </td>

      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.stockColumn}>
        <div class={styles.stockGroup}>
          <div>
            <Badge variant={variant.stockQuantity > 0 ? 'neutral' : 'danger'} class="rm-tabular">
              {variant.stockQuantity > 0
                ? ADMIN_VARIANTS_COPY.edit.stockCurrentLabel(variant.stockQuantity)
                : ADMIN_VARIANTS_COPY.edit.stockSoldOutLabel}
            </Badge>
          </div>

          <div class={styles.stockAdjustRow}>
            <div class={styles.deltaInputWrap}>
              <FormField
                label={ADMIN_VARIANTS_COPY.edit.adjustAmountLabel(label)}
                {...(stockError ? { error: stockError } : {})}
              >
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max={String(LIMITS.maxStock)}
                  placeholder={ADMIN_VARIANTS_COPY.edit.adjustPlaceholder}
                  value={deltaDraft}
                  disabled={busy || adjustingMode !== null}
                  onInput={(event) => {
                    setDeltaDraft(event.currentTarget.value);
                    if (stockError) setStockError(undefined);
                  }}
                />
              </FormField>
            </div>

            <div class={styles.stockButtons}>
              <Button
                variant="secondary"
                ariaLabel={ADMIN_VARIANTS_COPY.edit.addStockAria(label)}
                loading={adjustingMode === 'add'}
                disabled={busy || adjustingMode === 'remove'}
                leadingIcon={<Icon icon={Plus} size={16} />}
                onClick={() => {
                  void handleStockAdjust('add');
                }}
              >
                {ADMIN_VARIANTS_COPY.edit.addStockButton}
              </Button>
              <Button
                variant="secondary"
                ariaLabel={ADMIN_VARIANTS_COPY.edit.removeStockAria(label)}
                loading={adjustingMode === 'remove'}
                disabled={busy || adjustingMode === 'add'}
                leadingIcon={<Icon icon={Minus} size={16} />}
                onClick={() => {
                  void handleStockAdjust('remove');
                }}
              >
                {ADMIN_VARIANTS_COPY.edit.removeStockButton}
              </Button>
            </div>
          </div>
        </div>
      </td>

      <td class={styles.cell} data-label={ADMIN_VARIANTS_COPY.table.actionsColumn}>
        <div class={styles.actionsWrap}>
          <Button
            variant="quiet"
            disabled={busy || isLastVariant}
            ariaLabel={ADMIN_VARIANTS_COPY.edit.deleteVariantAria(label)}
            ariaDescribedBy={isLastVariant ? lastVariantNoteId : undefined}
            class={!isLastVariant ? styles.deleteBtn : undefined}
            leadingIcon={<Icon icon={Trash2} size={16} />}
            onClick={() => onRequestDelete(variant, label)}
          >
            {ADMIN_VARIANTS_COPY.edit.deleteVariantLabel}
          </Button>
          {isLastVariant ? (
            <p id={lastVariantNoteId} class={styles.lastVariantNote}>
              {ADMIN_VARIANTS_COPY.edit.lastVariantNote}
            </p>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
