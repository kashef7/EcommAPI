import type { JSX } from 'preact';
import { LIMITS } from '@/core/validation/validators';
import { Banner } from '@/ui/Banner/Banner';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { Card } from '@/ui/Card/Card';
import { ConfirmDialog } from '@/ui/Dialog/ConfirmDialog';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { Check, Pencil, Plus, Trash2, X } from '@/ui/Icon/icons';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { toast } from '@/ui/Toast/toast-store';
import { ADMIN_CATEGORIES_COPY } from '../copy';
import { useAdminCategories } from '../hooks/useAdminCategories';
import styles from './AdminCategoriesView.module.css';

function CategoriesListSkeleton() {
  return (
    <div
      class={styles.skeletonStack}
      aria-busy="true"
      aria-label={ADMIN_CATEGORIES_COPY.loadingLabel}
    >
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} class={styles.skeletonRow}>
          <Skeleton variant="text" width="55%" />
          <Skeleton variant="block" width="92px" height="44px" />
        </div>
      ))}
    </div>
  );
}

export function AdminCategoriesView() {
  const {
    categoriesResource,
    loadErrorMessage,
    newName,
    createFieldError,
    createFormErrors,
    createInputRef,
    creating,
    onNewNameChange,
    onNewNameBlur,
    submitCreate,
    editingId,
    editValue,
    editError,
    editInputRef,
    renaming,
    startRename,
    cancelRename,
    onEditValueChange,
    submitRename,
    deleteTarget,
    deleting,
    conflictBanner,
    dismissConflictBanner,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useAdminCategories();

  const categories = categoriesResource.data ?? [];
  const countText =
    categories.length === 1
      ? ADMIN_CATEGORIES_COPY.countSingular
      : ADMIN_CATEGORIES_COPY.countPlural(categories.length);

  async function handleCreateSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    const outcome = await submitCreate();
    if (outcome.ok) {
      toast.success(ADMIN_CATEGORIES_COPY.toasts.created);
    }
  }

  async function handleConfirmDelete() {
    const outcome = await confirmDelete();
    if (outcome.ok) {
      toast.success(ADMIN_CATEGORIES_COPY.toasts.deleted);
    } else if (outcome.message) {
      toast.error(outcome.message);
    }
  }

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <p class="rm-eyebrow">{ADMIN_CATEGORIES_COPY.eyebrow}</p>
        <h1>{ADMIN_CATEGORIES_COPY.title}</h1>
        <p class={styles.subtitle}>{ADMIN_CATEGORIES_COPY.subtitle}</p>
        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      </header>

      {conflictBanner ? (
        <Banner
          variant="danger"
          title={ADMIN_CATEGORIES_COPY.conflictBannerTitle}
          dismissLabel={ADMIN_CATEGORIES_COPY.dismissBannerLabel}
          onDismiss={dismissConflictBanner}
        >
          {conflictBanner}
        </Banner>
      ) : null}

      <div class={styles.grid}>
        <Card as="section" padding="lg">
          <h2 class={styles.cardHeading}>{ADMIN_CATEGORIES_COPY.newForm.heading}</h2>

          <form
            class={styles.createForm}
            noValidate
            onSubmit={(event) => {
              void handleCreateSubmit(event);
            }}
          >
            {createFormErrors.length > 0 ? (
              <Banner variant="danger" title={ADMIN_CATEGORIES_COPY.newForm.errorSummaryTitle}>
                {createFormErrors.length === 1 ? (
                  <span>{createFormErrors[0]}</span>
                ) : (
                  <ul class={styles.errorList}>
                    {createFormErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                )}
              </Banner>
            ) : null}

            <FormField
              label={ADMIN_CATEGORIES_COPY.newForm.fieldLabel}
              {...(createFieldError ? { error: createFieldError } : {})}
              required
            >
              <Input
                type="text"
                name="categoryName"
                maxLength={LIMITS.categoryNameMax}
                placeholder={ADMIN_CATEGORIES_COPY.newForm.placeholder}
                value={newName}
                inputRef={createInputRef}
                onInput={(event) => onNewNameChange(event.currentTarget.value)}
                onBlur={onNewNameBlur}
              />
            </FormField>

            <div>
              <Button
                type="submit"
                variant="primary"
                loading={creating}
                leadingIcon={<Icon icon={Plus} size={16} />}
              >
                {creating
                  ? ADMIN_CATEGORIES_COPY.newForm.submittingLabel
                  : ADMIN_CATEGORIES_COPY.newForm.submitLabel}
              </Button>
            </div>
          </form>
        </Card>

        <Card as="section" padding="lg">
          <div class={styles.listHeader}>
            <h2>{ADMIN_CATEGORIES_COPY.listHeading}</h2>
            {categoriesResource.data ? (
              <span class={`rm-tabular ${styles.countText}`}>{countText}</span>
            ) : null}
          </div>

          {categoriesResource.status === 'loading' && !categoriesResource.data ? (
            <CategoriesListSkeleton />
          ) : categoriesResource.status === 'error' && !categoriesResource.data ? (
            <ErrorState
              title={ADMIN_CATEGORIES_COPY.errorTitle}
              message={loadErrorMessage ?? ADMIN_CATEGORIES_COPY.errorTitle}
              onRetry={categoriesResource.reload}
            />
          ) : categories.length === 0 ? (
            <EmptyState
              heading={ADMIN_CATEGORIES_COPY.emptyHeading}
              message={ADMIN_CATEGORIES_COPY.emptyMessage}
            />
          ) : (
            <ul
              class={styles.list}
              aria-busy={categoriesResource.status === 'loading' ? 'true' : undefined}
              aria-label={
                categoriesResource.status === 'loading'
                  ? ADMIN_CATEGORIES_COPY.refreshingLabel
                  : undefined
              }
            >
              {categories.map((category) => {
                const isEditing = editingId === category.id;
                return (
                  <li key={category.id} class={styles.row}>
                    {isEditing ? (
                      <form
                        class={styles.editForm}
                        noValidate
                        onSubmit={(event) => {
                          event.preventDefault();
                          void submitRename(category).then((outcome) => {
                            if (outcome.ok) {
                              toast.success(ADMIN_CATEGORIES_COPY.toasts.renamed);
                            }
                          });
                        }}
                      >
                        <FormField
                          label={ADMIN_CATEGORIES_COPY.row.editFieldLabel}
                          {...(editError ? { error: editError } : {})}
                          required
                        >
                          <Input
                            type="text"
                            name="editCategoryName"
                            maxLength={LIMITS.categoryNameMax}
                            value={editValue}
                            inputRef={editInputRef}
                            disabled={renaming}
                            onInput={(event) => onEditValueChange(event.currentTarget.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                cancelRename();
                              }
                            }}
                          />
                        </FormField>
                        <div class={styles.editActions}>
                          <Button
                            type="submit"
                            variant="primary"
                            loading={renaming}
                            leadingIcon={<Icon icon={Check} size={16} />}
                          >
                            {renaming
                              ? ADMIN_CATEGORIES_COPY.row.savingLabel
                              : ADMIN_CATEGORIES_COPY.row.saveLabel}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={renaming}
                            leadingIcon={<Icon icon={X} size={16} />}
                            onClick={cancelRename}
                          >
                            {ADMIN_CATEGORIES_COPY.row.cancelLabel}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span class={styles.nameText}>{category.name}</span>
                        <div class={styles.rowActions}>
                          <IconButton
                            label={ADMIN_CATEGORIES_COPY.row.renameAria(category.name)}
                            variant="quiet"
                            onClick={() => startRename(category)}
                          >
                            <Icon icon={Pencil} size={16} />
                          </IconButton>
                          <IconButton
                            label={ADMIN_CATEGORIES_COPY.row.deleteAria(category.name)}
                            variant="danger"
                            onClick={() => requestDelete(category)}
                          >
                            <Icon icon={Trash2} size={16} />
                          </IconButton>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? ADMIN_CATEGORIES_COPY.deleteDialog.title(deleteTarget.name) : ''}
        message={ADMIN_CATEGORIES_COPY.deleteDialog.message}
        confirmLabel={ADMIN_CATEGORIES_COPY.deleteDialog.confirmLabel}
        cancelLabel={ADMIN_CATEGORIES_COPY.deleteDialog.cancelLabel}
        confirmVariant="danger"
        loading={deleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={cancelDelete}
      />
    </div>
  );
}
