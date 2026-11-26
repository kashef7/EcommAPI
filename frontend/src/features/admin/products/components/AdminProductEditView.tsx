import type { JSX } from 'preact';
import { routes } from '@/core/navigation/routes';
import { Banner } from '@/ui/Banner/Banner';
import { Button, buttonClassNames } from '@/ui/Button/Button';
import { Card } from '@/ui/Card/Card';
import { ConfirmDialog } from '@/ui/Dialog/ConfirmDialog';
import { EmptyState } from '@/ui/EmptyState/EmptyState';
import { ErrorState } from '@/ui/EmptyState/ErrorState';
import { Icon } from '@/ui/Icon/Icon';
import { ArrowLeft, ExternalLink, Trash2 } from '@/ui/Icon/icons';
import { Skeleton } from '@/ui/Skeleton/Skeleton';
import { toast } from '@/ui/Toast/toast-store';
import { ADMIN_OPTIONS_COPY } from '../../options/copy';
import { EditOptionsSection } from '../../options/components/EditOptionsSection';
import { ADMIN_VARIANTS_COPY } from '../../variants/copy';
import { EditVariantsSection } from '../../variants/components/EditVariantsSection';
import { ADMIN_PRODUCT_EDITOR_COPY } from '../editor-copy';
import { useEditProductEditor } from '../hooks/useEditProductEditor';
import styles from './AdminProductEditorView.module.css';
import { ProductBasicsFields } from './ProductBasicsFields';

export interface AdminProductEditViewProps {
  readonly productId: string;
}

function EditProductSkeleton() {
  return (
    <div class={styles.page} aria-busy="true" aria-label={ADMIN_PRODUCT_EDITOR_COPY.loadingLabel}>
      <div class={styles.header}>
        <Skeleton variant="text" width="140px" />
        <Skeleton variant="title" width="280px" />
      </div>
      <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      {[0, 1, 2].map((idx) => (
        <Card key={idx} padding="lg">
          <div class={styles.skeletonGroup}>
            <Skeleton variant="title" width="160px" />
            <Skeleton variant="block" height="44px" />
            <Skeleton variant="block" height="96px" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminProductEditView({ productId }: AdminProductEditViewProps) {
  const {
    productResource,
    product,
    isNotFound,
    loadErrorMessage,
    categories,
    tags,
    detailsDraft,
    detailsErrors,
    imageErrors,
    detailsFormErrors,
    isDirty,
    savingDetails,
    refs,
    updateDetailsField,
    blurDetailsField,
    blurImageRow,
    saveDetails,
    optionConflictBanner,
    dismissOptionConflictBanner,
    handleAddOption,
    handleRenameOption,
    handleDeleteOption,
    handleAddOptionValue,
    handleRenameOptionValue,
    handleDeleteOptionValue,
    handleSaveVariantPrice,
    handleAdjustVariantStock,
    handleAddVariant,
    handleDeleteVariant,
    deleteDialogOpen,
    deletingProduct,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteProduct,
  } = useEditProductEditor(productId);

  if (isNotFound) {
    return (
      <EmptyState
        heading={ADMIN_PRODUCT_EDITOR_COPY.notFound.heading}
        headingLevel="h1"
        message={ADMIN_PRODUCT_EDITOR_COPY.notFound.message}
        action={
          <a href={routes.adminProducts()} class={buttonClassNames({ variant: 'secondary' })}>
            {ADMIN_PRODUCT_EDITOR_COPY.notFound.actionLabel}
          </a>
        }
      />
    );
  }

  if (productResource.status === 'loading' && !product) {
    return <EditProductSkeleton />;
  }

  if (productResource.status === 'error' && !product) {
    return (
      <ErrorState
        title={ADMIN_PRODUCT_EDITOR_COPY.loadErrorTitle}
        headingLevel="h1"
        message={loadErrorMessage ?? ADMIN_PRODUCT_EDITOR_COPY.loadErrorTitle}
        onRetry={productResource.reload}
      />
    );
  }

  if (!product || !detailsDraft) {
    return <EditProductSkeleton />;
  }

  const isRefreshing = productResource.status === 'loading';

  async function handleDetailsSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    const outcome = await saveDetails();
    if (outcome.ok) {
      toast.success(ADMIN_PRODUCT_EDITOR_COPY.edit.detailsUpdatedToast);
    }
  }

  return (
    <div
      class={styles.page}
      aria-busy={isRefreshing ? 'true' : undefined}
      aria-label={isRefreshing ? ADMIN_PRODUCT_EDITOR_COPY.refreshingLabel : undefined}
    >
      <header class={styles.header}>
        <div class={styles.topActions}>
          <a href={routes.adminProducts()} class={buttonClassNames({ variant: 'quiet' })}>
            <Icon icon={ArrowLeft} size={16} />
            <span>{ADMIN_PRODUCT_EDITOR_COPY.backToProducts}</span>
          </a>

          <a href={routes.product(product.id)} class={buttonClassNames({ variant: 'secondary' })}>
            <Icon icon={ExternalLink} size={16} />
            <span>{ADMIN_PRODUCT_EDITOR_COPY.viewInShop}</span>
          </a>
        </div>

        <p class="rm-eyebrow">{ADMIN_PRODUCT_EDITOR_COPY.eyebrow}</p>
        <h1>{product.name}</h1>
        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      </header>

      <div class={styles.stack}>
        <Card as="section" padding="lg">
          <div class={styles.detailsHeader}>
            <h2>{ADMIN_PRODUCT_EDITOR_COPY.basics.headingEdit}</h2>
            {isDirty ? (
              <span class={styles.unsavedLabel} role="status">
                {ADMIN_PRODUCT_EDITOR_COPY.edit.unsavedChangesLabel}
              </span>
            ) : null}
          </div>

          <form
            ref={refs.detailsForm}
            class={styles.stack}
            noValidate
            onSubmit={(event) => {
              void handleDetailsSubmit(event);
            }}
          >
            {detailsFormErrors.length > 0 ? (
              <Banner
                variant="danger"
                title={ADMIN_PRODUCT_EDITOR_COPY.edit.detailsErrorSummaryTitle}
              >
                {detailsFormErrors.length === 1 ? (
                  <span>{detailsFormErrors[0]}</span>
                ) : (
                  <ul class={styles.errorList}>
                    {detailsFormErrors.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                )}
              </Banner>
            ) : null}

            <ProductBasicsFields
              values={detailsDraft}
              fieldErrors={detailsErrors}
              imageErrors={imageErrors}
              categories={categories}
              tagSuggestions={tags}
              disabled={savingDetails}
              refs={{
                name: refs.name,
                description: refs.description,
                categoryId: refs.categoryId,
              }}
              onChange={updateDetailsField}
              onBlurField={blurDetailsField}
              onBlurImageRow={blurImageRow}
            />

            <div class={styles.submitBar}>
              <Button type="submit" variant="primary" loading={savingDetails} disabled={!isDirty}>
                {savingDetails
                  ? ADMIN_PRODUCT_EDITOR_COPY.edit.savingDetailsLabel
                  : ADMIN_PRODUCT_EDITOR_COPY.edit.saveDetailsLabel}
              </Button>
            </div>
          </form>
        </Card>

        <EditOptionsSection
          options={product.options}
          variantsCount={product.variants.length}
          busy={isRefreshing}
          conflictBanner={optionConflictBanner}
          onDismissConflictBanner={dismissOptionConflictBanner}
          onAddOption={async (payload) => {
            const result = await handleAddOption(payload);
            if (result.ok) {
              toast.success(ADMIN_OPTIONS_COPY.edit.toasts.optionAdded);
            }
            return result;
          }}
          onRenameOption={async (optionId, name) => {
            const err = await handleRenameOption(optionId, name);
            if (!err) toast.success(ADMIN_OPTIONS_COPY.edit.toasts.optionRenamed);
            return err;
          }}
          onDeleteOption={async (optionId) => {
            const res = await handleDeleteOption(optionId);
            if (res.ok) toast.success(ADMIN_OPTIONS_COPY.edit.toasts.optionDeleted);
            else if (res.errorMessage) toast.error(res.errorMessage);
          }}
          onAddValue={async (optionId, value) => {
            const err = await handleAddOptionValue(optionId, value);
            if (!err) toast.success(ADMIN_OPTIONS_COPY.edit.toasts.valueAdded);
            return err;
          }}
          onRenameValue={async (optionId, valueId, value) => {
            const err = await handleRenameOptionValue(optionId, valueId, value);
            if (!err) toast.success(ADMIN_OPTIONS_COPY.edit.toasts.valueRenamed);
            return err;
          }}
          onDeleteValue={async (optionId, valueId) => {
            const res = await handleDeleteOptionValue(optionId, valueId);
            if (res.ok) toast.success(ADMIN_OPTIONS_COPY.edit.toasts.valueDeleted);
            else if (res.errorMessage) toast.error(res.errorMessage);
          }}
        />

        <EditVariantsSection
          options={product.options}
          variants={product.variants}
          busy={isRefreshing}
          onSavePrice={async (variantId, price) => {
            const res = await handleSaveVariantPrice(variantId, price);
            if (res.ok) {
              toast.success(ADMIN_VARIANTS_COPY.edit.toasts.priceUpdated);
              return undefined;
            }
            if (res.errorMessage) toast.error(res.errorMessage);
            return res.errorMessage;
          }}
          onAdjustStock={async (variantId, delta) => {
            const res = await handleAdjustVariantStock(variantId, delta);
            if (res.ok && res.stock !== undefined) {
              toast.success(ADMIN_VARIANTS_COPY.edit.toasts.stockUpdated(res.stock));
              return undefined;
            }
            if (res.errorMessage) toast.error(res.errorMessage);
            return res.errorMessage;
          }}
          onAddVariant={async (payload) => {
            const result = await handleAddVariant(payload);
            if (result.ok) {
              toast.success(ADMIN_VARIANTS_COPY.edit.toasts.variantAdded);
            }
            return result;
          }}
          onDeleteVariant={async (variantId) => {
            const res = await handleDeleteVariant(variantId);
            if (res.ok) toast.success(ADMIN_VARIANTS_COPY.edit.toasts.variantDeleted);
            else if (res.errorMessage) toast.error(res.errorMessage);
          }}
        />

        <Card
          as="section"
          padding="lg"
          {...(styles.dangerCard ? { class: styles.dangerCard } : {})}
        >
          <div class={styles.dangerRow}>
            <div>
              <h2>{ADMIN_PRODUCT_EDITOR_COPY.edit.dangerZoneHeading}</h2>
              <p class={styles.dangerText}>
                {ADMIN_PRODUCT_EDITOR_COPY.edit.dangerZoneDescription}
              </p>
            </div>
            <Button
              variant="danger"
              leadingIcon={<Icon icon={Trash2} size={16} />}
              onClick={openDeleteDialog}
            >
              {ADMIN_PRODUCT_EDITOR_COPY.edit.deleteProductLabel}
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title={ADMIN_PRODUCT_EDITOR_COPY.edit.deleteDialogTitle(product.name)}
        message={ADMIN_PRODUCT_EDITOR_COPY.edit.deleteDialogMessage}
        confirmLabel={ADMIN_PRODUCT_EDITOR_COPY.edit.deleteDialogConfirm}
        cancelLabel={ADMIN_PRODUCT_EDITOR_COPY.edit.deleteDialogCancel}
        confirmVariant="danger"
        loading={deletingProduct}
        onConfirm={() => {
          void confirmDeleteProduct(ADMIN_PRODUCT_EDITOR_COPY.edit.deletedToast(product.name)).then(
            (res) => {
              if (!res.ok && res.errorMessage) {
                toast.error(res.errorMessage);
              }
            },
          );
        }}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}
