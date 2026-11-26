import { useState } from 'preact/hooks';
import { Button } from '@/ui/Button/Button';
import { Card } from '@/ui/Card/Card';
import { ConfirmDialog } from '@/ui/Dialog/ConfirmDialog';
import { Icon } from '@/ui/Icon/Icon';
import { Plus } from '@/ui/Icon/icons';
import { ADMIN_VARIANTS_COPY } from '../copy';
import {
  type AddVariantDialogResult,
  type AddVariantSubmitPayload,
  type AdminVariantModel,
  type AdminVariantOptionModel,
  formatVariantCombinationLabel,
} from '../model/variant-combinations';
import { AddVariantDialog } from './AddVariantDialog';
import { EditVariantRow } from './EditVariantRow';
import styles from './EditVariantsSection.module.css';

export interface EditVariantsSectionProps {
  readonly options: readonly AdminVariantOptionModel[];
  readonly variants: readonly AdminVariantModel[];
  readonly busy: boolean;
  readonly onSavePrice: (variantId: string, price: number) => Promise<string | undefined>;
  readonly onAdjustStock: (variantId: string, delta: number) => Promise<string | undefined>;
  readonly onAddVariant: (payload: AddVariantSubmitPayload) => Promise<AddVariantDialogResult>;
  readonly onDeleteVariant: (variantId: string) => Promise<void>;
}

export function EditVariantsSection({
  options,
  variants,
  busy,
  onSavePrice,
  onAdjustStock,
  onAddVariant,
  onDeleteVariant,
}: EditVariantsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    readonly variant: AdminVariantModel;
    readonly label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAddSubmit(
    payload: AddVariantSubmitPayload,
  ): Promise<AddVariantDialogResult> {
    setAddingVariant(true);
    try {
      const result = await onAddVariant(payload);
      if (result.ok) {
        setAddDialogOpen(false);
      }
      return result;
    } finally {
      setAddingVariant(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await onDeleteVariant(deleteTarget.variant.id);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <Card as="section" padding="lg" {...(styles.section ? { class: styles.section } : {})}>
      <div class={styles.headerRow}>
        <h2>{ADMIN_VARIANTS_COPY.heading}</h2>
        <Button
          variant="secondary"
          disabled={busy}
          leadingIcon={<Icon icon={Plus} size={16} />}
          onClick={() => setAddDialogOpen(true)}
        >
          {ADMIN_VARIANTS_COPY.edit.addVariantButton}
        </Button>
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
            {variants.map((variant) => {
              const label = formatVariantCombinationLabel(options, variant.optionValues);
              return (
                <EditVariantRow
                  key={variant.id}
                  variant={variant}
                  label={label}
                  isLastVariant={variants.length <= 1}
                  busy={busy}
                  onSavePrice={onSavePrice}
                  onAdjustStock={onAdjustStock}
                  onRequestDelete={(targetVariant, targetLabel) =>
                    setDeleteTarget({ variant: targetVariant, label: targetLabel })
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <AddVariantDialog
        open={addDialogOpen}
        options={options}
        existingVariants={variants}
        submitting={addingVariant}
        onSubmit={handleAddSubmit}
        onClose={() => setAddDialogOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? ADMIN_VARIANTS_COPY.edit.deleteDialogTitle(deleteTarget.label) : ''}
        message={ADMIN_VARIANTS_COPY.edit.deleteDialogMessage}
        confirmLabel={ADMIN_VARIANTS_COPY.edit.deleteDialogConfirm}
        cancelLabel={ADMIN_VARIANTS_COPY.edit.deleteDialogCancel}
        confirmVariant="danger"
        loading={deleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </Card>
  );
}
