import type { RefObject } from 'preact';
import { routes } from '@/core/navigation/routes';
import { LIMITS } from '@/core/validation/validators';
import { Banner } from '@/ui/Banner/Banner';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Select } from '@/ui/Form/Select';
import { Textarea } from '@/ui/Form/Textarea';
import { ADMIN_PRODUCT_EDITOR_COPY } from '../editor-copy';
import type {
  AdminCategoryItem,
  AdminTagSuggestion,
  BasicsFieldKey,
  ProductBasicsValues,
} from '../model/product-validation';
import { ImageUrlListEditor } from './ImageUrlListEditor';
import styles from './ProductBasicsFields.module.css';
import { TagChipInput } from './TagChipInput';

export interface ProductBasicsFieldsProps {
  readonly values: ProductBasicsValues;
  readonly fieldErrors: Partial<Record<BasicsFieldKey, string>>;
  readonly imageErrors: Readonly<Record<number, string>>;
  readonly categories: readonly AdminCategoryItem[];
  readonly tagSuggestions: readonly AdminTagSuggestion[];
  readonly disabled?: boolean;
  readonly refs?: {
    readonly name?: RefObject<HTMLInputElement>;
    readonly description?: RefObject<HTMLTextAreaElement>;
    readonly categoryId?: RefObject<HTMLSelectElement>;
  };
  readonly onChange: <K extends keyof ProductBasicsValues>(
    field: K,
    nextValue: ProductBasicsValues[K],
  ) => void;
  readonly onBlurField?: (field: 'name' | 'description' | 'categoryId') => void;
  readonly onBlurImageRow?: (index: number) => void;
}

export function ProductBasicsFields({
  values,
  fieldErrors,
  imageErrors,
  categories,
  tagSuggestions,
  disabled = false,
  refs,
  onChange,
  onBlurField,
  onBlurImageRow,
}: ProductBasicsFieldsProps) {
  return (
    <div class={styles.stack}>
      {categories.length === 0 ? (
        <Banner variant="warning">
          <span>{ADMIN_PRODUCT_EDITOR_COPY.basics.noCategoriesWarning} </span>
          <a href={routes.adminCategories()} class={styles.categoryWarningLink}>
            {ADMIN_PRODUCT_EDITOR_COPY.basics.noCategoriesLink}
          </a>
        </Banner>
      ) : null}

      <FormField
        label={ADMIN_PRODUCT_EDITOR_COPY.basics.nameLabel}
        {...(fieldErrors.name ? { error: fieldErrors.name } : {})}
        required
      >
        <Input
          type="text"
          name="name"
          maxLength={LIMITS.productNameMax}
          placeholder={ADMIN_PRODUCT_EDITOR_COPY.basics.namePlaceholder}
          value={values.name}
          disabled={disabled}
          {...(refs?.name ? { inputRef: refs.name } : {})}
          onInput={(event) => onChange('name', event.currentTarget.value)}
          onBlur={() => onBlurField?.('name')}
        />
      </FormField>

      <div>
        <FormField
          label={ADMIN_PRODUCT_EDITOR_COPY.basics.descriptionLabel}
          {...(fieldErrors.description ? { error: fieldErrors.description } : {})}
          required
        >
          <Textarea
            name="description"
            maxLength={LIMITS.productDescriptionMax}
            placeholder={ADMIN_PRODUCT_EDITOR_COPY.basics.descriptionPlaceholder}
            value={values.description}
            disabled={disabled}
            {...(refs?.description ? { textareaRef: refs.description } : {})}
            onInput={(event) => onChange('description', event.currentTarget.value)}
            onBlur={() => onBlurField?.('description')}
          />
        </FormField>
        <div class={`rm-tabular ${styles.counterRow}`} aria-live="polite">
          {ADMIN_PRODUCT_EDITOR_COPY.basics.descriptionCounter(
            values.description.length,
            LIMITS.productDescriptionMax,
          )}
        </div>
      </div>

      <FormField
        label={ADMIN_PRODUCT_EDITOR_COPY.basics.categoryLabel}
        {...(fieldErrors.categoryId ? { error: fieldErrors.categoryId } : {})}
        required
      >
        <Select
          name="categoryId"
          value={values.categoryId}
          disabled={disabled}
          {...(refs?.categoryId ? { selectRef: refs.categoryId } : {})}
          onChange={(event) => onChange('categoryId', event.currentTarget.value)}
          onBlur={() => onBlurField?.('categoryId')}
        >
          <option value="">{ADMIN_PRODUCT_EDITOR_COPY.basics.categoryPlaceholder}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </FormField>

      <TagChipInput
        tags={values.tags}
        suggestions={tagSuggestions}
        {...(fieldErrors.tags ? { error: fieldErrors.tags } : {})}
        disabled={disabled}
        onChange={(nextTags) => onChange('tags', nextTags)}
      />

      <ImageUrlListEditor
        imageUrls={values.imageUrls}
        imageErrors={imageErrors}
        {...(fieldErrors.imageUrls ? { listError: fieldErrors.imageUrls } : {})}
        disabled={disabled}
        onChange={(nextUrls) => onChange('imageUrls', nextUrls)}
        {...(onBlurImageRow ? { onBlurRow: onBlurImageRow } : {})}
      />
    </div>
  );
}
