import { useState } from 'preact/hooks';
import { LIMITS } from '@/core/validation/validators';
import { Button } from '@/ui/Button/Button';
import { Chip } from '@/ui/Chip/Chip';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { Plus, Tag } from '@/ui/Icon/icons';
import { ADMIN_PRODUCT_EDITOR_COPY } from '../editor-copy';
import { type AdminTagSuggestion, tryAddTag } from '../model/product-validation';
import styles from './TagChipInput.module.css';

export interface TagChipInputProps {
  readonly tags: readonly string[];
  readonly suggestions: readonly AdminTagSuggestion[];
  readonly error?: string;
  readonly disabled?: boolean;
  readonly onChange: (nextTags: readonly string[]) => void;
}

const MAX_SUGGESTIONS_SHOWN = 12;

export function TagChipInput({
  tags,
  suggestions,
  error,
  disabled = false,
  onChange,
}: TagChipInputProps) {
  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  function addRawTag(raw: string) {
    const result = tryAddTag(tags, raw);
    if (!result.ok) {
      if (result.error) {
        setLocalError(result.error);
      }
      return;
    }
    setLocalError(undefined);
    setDraft('');
    onChange(result.tags);
  }

  function handleInput(value: string) {
    if (localError) {
      setLocalError(undefined);
    }
    if (!value.includes(',')) {
      setDraft(value);
      return;
    }

    const parts = value.split(',');
    const trailing = parts.pop() ?? '';
    let nextTags = tags;
    let firstError: string | undefined;

    for (const part of parts) {
      if (part.trim().length === 0) continue;
      const result = tryAddTag(nextTags, part);
      nextTags = result.tags;
      if (!result.ok && result.error && !firstError) {
        firstError = result.error;
      }
    }

    if (nextTags !== tags) {
      onChange(nextTags);
    }
    setLocalError(firstError);
    setDraft(trailing);
  }

  function handleRemoveTag(tagToRemove: string) {
    setLocalError(undefined);
    onChange(tags.filter((tag) => tag !== tagToRemove));
  }

  const normalizedDraft = draft.trim().toLowerCase();
  const availableSuggestions = suggestions
    .filter((item) => !tags.includes(item.name.toLowerCase()))
    .filter((item) => !normalizedDraft || item.name.toLowerCase().includes(normalizedDraft))
    .slice(0, MAX_SUGGESTIONS_SHOWN);

  const combinedError = localError ?? error;

  return (
    <div class={styles.wrapper}>
      <FormField
        label={ADMIN_PRODUCT_EDITOR_COPY.basics.tagsLabel}
        hint={ADMIN_PRODUCT_EDITOR_COPY.basics.tagsHint(tags.length, LIMITS.productTagsMax)}
        {...(combinedError ? { error: combinedError } : {})}
      >
        {(a11yProps) => (
          <div class={styles.inputRow}>
            <div class={styles.inputWrap}>
              <Input
                {...a11yProps}
                type="text"
                name="tagDraft"
                maxLength={LIMITS.tagNameMax}
                placeholder={ADMIN_PRODUCT_EDITOR_COPY.basics.tagInputPlaceholder}
                value={draft}
                disabled={disabled}
                onInput={(event) => handleInput(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addRawTag(draft);
                  }
                }}
              />
            </div>
            <Button
              variant="secondary"
              ariaLabel={ADMIN_PRODUCT_EDITOR_COPY.basics.tagAddAria}
              disabled={disabled || draft.trim().length === 0}
              leadingIcon={<Icon icon={Plus} size={16} />}
              onClick={() => addRawTag(draft)}
            >
              {ADMIN_PRODUCT_EDITOR_COPY.basics.tagAddButton}
            </Button>
          </div>
        )}
      </FormField>

      {tags.length > 0 ? (
        <div class={styles.chipsWrap}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              disabled={disabled}
              icon={<Icon icon={Tag} size={16} />}
              removeLabel={ADMIN_PRODUCT_EDITOR_COPY.basics.tagRemoveAria(tag)}
              onRemove={() => handleRemoveTag(tag)}
            >
              {tag}
            </Chip>
          ))}
        </div>
      ) : null}

      {availableSuggestions.length > 0 ? (
        <div class={styles.suggestionsBlock}>
          <span class={styles.suggestionsLabel}>
            {ADMIN_PRODUCT_EDITOR_COPY.basics.tagSuggestionsLabel}
          </span>
          <div class={styles.chipsWrap}>
            {availableSuggestions.map((item) => (
              <Chip key={item.id} disabled={disabled} onClick={() => addRawTag(item.name)}>
                {item.name}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
