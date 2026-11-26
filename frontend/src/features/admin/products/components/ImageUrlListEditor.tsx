import { LIMITS } from '@/core/validation/validators';
import { Badge } from '@/ui/Badge/Badge';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@/ui/Icon/icons';
import { ImageWithFallback } from '@/ui/ImageWithFallback/ImageWithFallback';
import { ADMIN_PRODUCT_EDITOR_COPY } from '../editor-copy';
import { moveListItem } from '../model/product-validation';
import styles from './ImageUrlListEditor.module.css';

export interface ImageUrlListEditorProps {
  readonly imageUrls: readonly string[];
  readonly imageErrors: Readonly<Record<number, string>>;
  readonly listError?: string;
  readonly disabled?: boolean;
  readonly onChange: (nextUrls: readonly string[]) => void;
  readonly onBlurRow?: (index: number) => void;
}

export function ImageUrlListEditor({
  imageUrls,
  imageErrors,
  listError,
  disabled = false,
  onChange,
  onBlurRow,
}: ImageUrlListEditorProps) {
  function handleUrlChange(index: number, nextValue: string) {
    const next = imageUrls.map((item, idx) => (idx === index ? nextValue : item));
    onChange(next);
  }

  function handleMove(index: number, delta: -1 | 1) {
    onChange(moveListItem(imageUrls, index, index + delta));
  }

  function handleRemove(index: number) {
    onChange(imageUrls.filter((_, idx) => idx !== index));
  }

  function handleAdd() {
    if (imageUrls.length >= LIMITS.productImagesMax) {
      return;
    }
    onChange([...imageUrls, '']);
  }

  return (
    <div class={styles.wrapper}>
      <div class={styles.headerRow}>
        <span class={styles.sectionLabel}>{ADMIN_PRODUCT_EDITOR_COPY.basics.imagesLabel}</span>
        <span class={`rm-tabular ${styles.hint}`}>
          {ADMIN_PRODUCT_EDITOR_COPY.basics.imagesHint(imageUrls.length, LIMITS.productImagesMax)}
        </span>
      </div>

      {listError ? (
        <p role="alert" class={styles.listError}>
          {listError}
        </p>
      ) : null}

      {imageUrls.length === 0 ? (
        <p class={styles.emptyNote}>{ADMIN_PRODUCT_EDITOR_COPY.basics.imageEmptyNote}</p>
      ) : (
        <div class={styles.list}>
          {imageUrls.map((url, index) => (
            <div key={index} class={styles.itemCard}>
              <div class={styles.previewWrap}>
                <ImageWithFallback
                  src={url}
                  alt={ADMIN_PRODUCT_EDITOR_COPY.basics.imagePreviewAlt(index)}
                  aspectRatio="4/5"
                />
              </div>

              <div class={styles.itemMain}>
                <div class={styles.itemTop}>
                  {index === 0 ? (
                    <Badge variant="neutral">{ADMIN_PRODUCT_EDITOR_COPY.basics.primaryBadge}</Badge>
                  ) : (
                    <span class={styles.hint}>
                      {ADMIN_PRODUCT_EDITOR_COPY.basics.imageRowLabel(index)}
                    </span>
                  )}

                  <div class={styles.itemControls}>
                    <IconButton
                      label={ADMIN_PRODUCT_EDITOR_COPY.basics.moveUpAria(index)}
                      variant="quiet"
                      disabled={disabled || index === 0}
                      onClick={() => handleMove(index, -1)}
                    >
                      <Icon icon={ArrowUp} size={16} />
                    </IconButton>
                    <IconButton
                      label={ADMIN_PRODUCT_EDITOR_COPY.basics.moveDownAria(index)}
                      variant="quiet"
                      disabled={disabled || index === imageUrls.length - 1}
                      onClick={() => handleMove(index, 1)}
                    >
                      <Icon icon={ArrowDown} size={16} />
                    </IconButton>
                    <IconButton
                      label={ADMIN_PRODUCT_EDITOR_COPY.basics.removeImageAria(index)}
                      variant="danger"
                      disabled={disabled}
                      onClick={() => handleRemove(index)}
                    >
                      <Icon icon={Trash2} size={16} />
                    </IconButton>
                  </div>
                </div>

                <FormField
                  label={ADMIN_PRODUCT_EDITOR_COPY.basics.imageRowLabel(index)}
                  {...(imageErrors[index] ? { error: imageErrors[index] } : {})}
                >
                  <Input
                    type="url"
                    name={`imageUrls[${index}]`}
                    maxLength={LIMITS.imageUrlMax}
                    placeholder={ADMIN_PRODUCT_EDITOR_COPY.basics.imageRowPlaceholder}
                    value={url}
                    disabled={disabled}
                    onInput={(event) => handleUrlChange(index, event.currentTarget.value)}
                    onBlur={() => onBlurRow?.(index)}
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <Button
          variant="secondary"
          disabled={disabled || imageUrls.length >= LIMITS.productImagesMax}
          leadingIcon={<Icon icon={Plus} size={16} />}
          onClick={handleAdd}
        >
          {ADMIN_PRODUCT_EDITOR_COPY.basics.addImageButton}
        </Button>
      </div>
    </div>
  );
}
