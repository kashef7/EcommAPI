import type { JSX } from 'preact';
import { routes } from '@/core/navigation/routes';
import { Banner } from '@/ui/Banner/Banner';
import { Button, buttonClassNames } from '@/ui/Button/Button';
import { Card } from '@/ui/Card/Card';
import { ConfirmDialog } from '@/ui/Dialog/ConfirmDialog';
import { Icon } from '@/ui/Icon/Icon';
import { ArrowLeft } from '@/ui/Icon/icons';
import { toast } from '@/ui/Toast/toast-store';
import { CreateOptionsSection } from '../../options/components/CreateOptionsSection';
import { ADMIN_VARIANTS_COPY } from '../../variants/copy';
import { CreateVariantsSection } from '../../variants/components/CreateVariantsSection';
import { ADMIN_PRODUCT_EDITOR_COPY } from '../editor-copy';
import { useCreateProductEditor } from '../hooks/useCreateProductEditor';
import styles from './AdminProductEditorView.module.css';
import { ProductBasicsFields } from './ProductBasicsFields';

export function AdminProductCreateView() {
  const {
    categories,
    tags,
    basics,
    basicsErrors,
    imageErrors,
    options,
    optionErrors,
    singleVariant,
    singleVariantError,
    variants,
    variantErrors,
    variantsSectionError,
    pendingConfirmCount,
    formErrors,
    submitting,
    refs,
    updateBasicsField,
    blurBasicsField,
    blurImageRow,
    addOption,
    removeOption,
    renameOption,
    changeOptionValues,
    requestGenerateCombinations,
    confirmGenerateMany,
    cancelGenerateMany,
    updateSingleVariant,
    blurSingleVariant,
    updateVariantRow,
    blurVariantRow,
    removeVariantRow,
    applyPriceToAll,
    applyStockToAll,
    submitCreate,
  } = useCreateProductEditor(ADMIN_PRODUCT_EDITOR_COPY.create.successToast);

  async function handleSubmit(event: JSX.TargetedEvent<HTMLFormElement>) {
    event.preventDefault();
    const outcome = await submitCreate();
    if (outcome.ok) {
      toast.success(ADMIN_PRODUCT_EDITOR_COPY.create.successToast);
    }
  }

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <div class={styles.topActions}>
          <a href={routes.adminProducts()} class={buttonClassNames({ variant: 'quiet' })}>
            <Icon icon={ArrowLeft} size={16} />
            <span>{ADMIN_PRODUCT_EDITOR_COPY.backToProducts}</span>
          </a>
        </div>
        <p class="rm-eyebrow">{ADMIN_PRODUCT_EDITOR_COPY.eyebrow}</p>
        <h1>{ADMIN_PRODUCT_EDITOR_COPY.createTitle}</h1>
        <p class={styles.subtitle}>{ADMIN_PRODUCT_EDITOR_COPY.createSubtitle}</p>
        <hr class="rm-ornament rm-ornament--diamond" aria-hidden="true" />
      </header>

      <form
        ref={refs.form}
        class={styles.stack}
        noValidate
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        {formErrors.length > 0 ? (
          <Banner variant="danger" title={ADMIN_PRODUCT_EDITOR_COPY.create.errorSummaryTitle}>
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

        <Card as="section" padding="lg">
          <h2 class={styles.sectionHeading}>{ADMIN_PRODUCT_EDITOR_COPY.basics.headingCreate}</h2>
          <ProductBasicsFields
            values={basics}
            fieldErrors={basicsErrors}
            imageErrors={imageErrors}
            categories={categories}
            tagSuggestions={tags}
            disabled={submitting}
            refs={{
              name: refs.name,
              description: refs.description,
              categoryId: refs.categoryId,
            }}
            onChange={updateBasicsField}
            onBlurField={blurBasicsField}
            onBlurImageRow={blurImageRow}
          />
        </Card>

        <Card as="section" padding="lg">
          <CreateOptionsSection
            options={options}
            optionErrors={optionErrors}
            disabled={submitting}
            onAddOption={addOption}
            onRemoveOption={removeOption}
            onRenameOption={renameOption}
            onChangeValues={changeOptionValues}
          />
        </Card>

        <Card as="section" padding="lg">
          <CreateVariantsSection
            hasOptions={options.length > 0}
            singleVariant={singleVariant}
            singleVariantError={singleVariantError}
            variants={variants}
            variantErrors={variantErrors}
            {...(variantsSectionError ? { sectionError: variantsSectionError } : {})}
            disabled={submitting}
            generateButtonRef={refs.generateButton}
            onSingleChange={updateSingleVariant}
            onBlurSingle={blurSingleVariant}
            onGenerate={requestGenerateCombinations}
            onVariantChange={updateVariantRow}
            onBlurVariant={blurVariantRow}
            onRemoveVariant={removeVariantRow}
            onApplyPriceToAll={applyPriceToAll}
            onApplyStockToAll={applyStockToAll}
          />
        </Card>

        <div class={styles.submitBar}>
          <a href={routes.adminProducts()} class={buttonClassNames({ variant: 'secondary' })}>
            {ADMIN_PRODUCT_EDITOR_COPY.backToProducts}
          </a>
          <Button type="submit" variant="primary" size="lg" loading={submitting}>
            {submitting
              ? ADMIN_PRODUCT_EDITOR_COPY.create.submittingLabel
              : ADMIN_PRODUCT_EDITOR_COPY.create.submitLabel}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={pendingConfirmCount !== null}
        title={ADMIN_VARIANTS_COPY.confirmManyDialog.title}
        message={
          pendingConfirmCount !== null
            ? ADMIN_VARIANTS_COPY.confirmManyDialog.message(pendingConfirmCount)
            : ''
        }
        confirmLabel={ADMIN_VARIANTS_COPY.confirmManyDialog.confirmLabel}
        cancelLabel={ADMIN_VARIANTS_COPY.confirmManyDialog.cancelLabel}
        confirmVariant="primary"
        onConfirm={confirmGenerateMany}
        onCancel={cancelGenerateMany}
      />
    </div>
  );
}
