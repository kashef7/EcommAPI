import { useState } from 'preact/hooks';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { Card } from '@/ui/Card/Card';
import { ConfirmDialog } from '@/ui/Dialog/ConfirmDialog';
import { Icon } from '@/ui/Icon/Icon';
import { Plus } from '@/ui/Icon/icons';
import { ADMIN_OPTIONS_COPY } from '../copy';
import type {
  AddOptionDialogResult,
  AddOptionSubmitPayload,
  AdminOptionModel,
  AdminOptionValueModel,
} from '../model/option-validation';
import { AddOptionDialog } from './AddOptionDialog';
import { EditOptionItem } from './EditOptionItem';
import styles from './EditOptionsSection.module.css';

export interface EditOptionsSectionProps {
  readonly options: readonly AdminOptionModel[];
  readonly variantsCount: number;
  readonly busy: boolean;
  readonly conflictBanner: string | null;
  readonly onDismissConflictBanner: () => void;
  readonly onAddOption: (payload: AddOptionSubmitPayload) => Promise<AddOptionDialogResult>;
  readonly onRenameOption: (optionId: string, name: string) => Promise<string | undefined>;
  readonly onDeleteOption: (optionId: string) => Promise<void>;
  readonly onAddValue: (optionId: string, value: string) => Promise<string | undefined>;
  readonly onRenameValue: (
    optionId: string,
    valueId: string,
    value: string,
  ) => Promise<string | undefined>;
  readonly onDeleteValue: (optionId: string, valueId: string) => Promise<void>;
}

export function EditOptionsSection({
  options,
  variantsCount,
  busy,
  conflictBanner,
  onDismissConflictBanner,
  onAddOption,
  onRenameOption,
  onDeleteOption,
  onAddValue,
  onRenameValue,
  onDeleteValue,
}: EditOptionsSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingOption, setAddingOption] = useState(false);

  const [deleteOptionTarget, setDeleteOptionTarget] = useState<AdminOptionModel | null>(null);
  const [deleteValueTarget, setDeleteValueTarget] = useState<{
    readonly option: AdminOptionModel;
    readonly valueItem: AdminOptionValueModel;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAddOptionSubmit(
    payload: AddOptionSubmitPayload,
  ): Promise<AddOptionDialogResult> {
    setAddingOption(true);
    try {
      const result = await onAddOption(payload);
      if (result.ok) {
        setAddDialogOpen(false);
      }
      return result;
    } finally {
      setAddingOption(false);
    }
  }

  async function handleConfirmDeleteOption() {
    if (!deleteOptionTarget || deleting) return;
    setDeleting(true);
    try {
      await onDeleteOption(deleteOptionTarget.id);
    } finally {
      setDeleting(false);
      setDeleteOptionTarget(null);
    }
  }

  async function handleConfirmDeleteValue() {
    if (!deleteValueTarget || deleting) return;
    setDeleting(true);
    try {
      await onDeleteValue(deleteValueTarget.option.id, deleteValueTarget.valueItem.id);
    } finally {
      setDeleting(false);
      setDeleteValueTarget(null);
    }
  }

  return (
    <Card as="section" padding="lg" {...(styles.section ? { class: styles.section } : {})}>
      <div class={styles.headerRow}>
        <h2>{ADMIN_OPTIONS_COPY.editHeading}</h2>
        <Button
          variant="secondary"
          disabled={busy}
          leadingIcon={<Icon icon={Plus} size={16} />}
          onClick={() => setAddDialogOpen(true)}
        >
          {ADMIN_OPTIONS_COPY.addOptionButton}
        </Button>
      </div>

      {conflictBanner ? (
        <Banner
          variant="danger"
          title={ADMIN_OPTIONS_COPY.conflictBannerTitle}
          dismissLabel={ADMIN_OPTIONS_COPY.dismissBannerLabel}
          onDismiss={onDismissConflictBanner}
        >
          {conflictBanner}
        </Banner>
      ) : null}

      {options.length === 0 ? (
        <p class={styles.emptyNote}>{ADMIN_OPTIONS_COPY.singleVersionEditNote}</p>
      ) : (
        <div class={styles.optionList}>
          {options.map((option) => (
            <EditOptionItem
              key={option.id}
              option={option}
              otherOptionNamesLower={options
                .filter((other) => other.id !== option.id)
                .map((other) => other.name.trim().toLowerCase())}
              busy={busy}
              onRenameOption={onRenameOption}
              onDeleteOption={setDeleteOptionTarget}
              onAddValue={onAddValue}
              onRenameValue={onRenameValue}
              onDeleteValue={(opt, val) => setDeleteValueTarget({ option: opt, valueItem: val })}
            />
          ))}
        </div>
      )}

      <AddOptionDialog
        open={addDialogOpen}
        existingOptionNames={options.map((o) => o.name)}
        existingVariantsCount={variantsCount}
        submitting={addingOption}
        onSubmit={handleAddOptionSubmit}
        onClose={() => setAddDialogOpen(false)}
      />

      <ConfirmDialog
        open={deleteOptionTarget !== null}
        title={
          deleteOptionTarget
            ? ADMIN_OPTIONS_COPY.edit.deleteOptionTitle(deleteOptionTarget.name)
            : ''
        }
        message={ADMIN_OPTIONS_COPY.edit.deleteOptionMessage}
        confirmLabel={ADMIN_OPTIONS_COPY.edit.deleteOptionConfirm}
        cancelLabel={ADMIN_OPTIONS_COPY.edit.cancelDialogLabel}
        confirmVariant="danger"
        loading={deleting}
        onConfirm={() => {
          void handleConfirmDeleteOption();
        }}
        onCancel={() => {
          if (!deleting) setDeleteOptionTarget(null);
        }}
      />

      <ConfirmDialog
        open={deleteValueTarget !== null}
        title={
          deleteValueTarget
            ? ADMIN_OPTIONS_COPY.edit.deleteValueTitle(deleteValueTarget.valueItem.value)
            : ''
        }
        message={ADMIN_OPTIONS_COPY.edit.deleteValueMessage}
        confirmLabel={ADMIN_OPTIONS_COPY.edit.deleteValueConfirm}
        cancelLabel={ADMIN_OPTIONS_COPY.edit.cancelDialogLabel}
        confirmVariant="danger"
        loading={deleting}
        onConfirm={() => {
          void handleConfirmDeleteValue();
        }}
        onCancel={() => {
          if (!deleting) setDeleteValueTarget(null);
        }}
      />
    </Card>
  );
}
