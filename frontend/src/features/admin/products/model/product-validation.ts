import { normalizeTagName } from '@/core/format/text';
import {
  LIMITS,
  isValidGuid,
  isValidHttpUrl,
  validateRequiredText,
} from '@/core/validation/validators';

export interface AdminCategoryItem {
  readonly id: string;
  readonly name: string;
}

export interface AdminTagSuggestion {
  readonly id: string;
  readonly name: string;
}

export interface ProductBasicsValues {
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly tags: readonly string[];
  readonly imageUrls: readonly string[];
}

export type BasicsFieldKey = 'name' | 'description' | 'categoryId' | 'tags' | 'imageUrls';

export const BASICS_FIELD_ORDER: readonly BasicsFieldKey[] = [
  'name',
  'description',
  'categoryId',
  'tags',
  'imageUrls',
];

export interface ProductBasicsValidationResult {
  readonly fieldErrors: Partial<Record<BasicsFieldKey, string>>;
  readonly imageErrors: Readonly<Record<number, string>>;
  readonly hasErrors: boolean;
}

export function validateBasicsField(
  field: 'name' | 'description' | 'categoryId',
  values: ProductBasicsValues,
): string | undefined {
  if (field === 'name') {
    return validateRequiredText(values.name, 'Product name', LIMITS.productNameMax);
  }
  if (field === 'description') {
    return validateRequiredText(values.description, 'Description', LIMITS.productDescriptionMax);
  }
  if (!isValidGuid(values.categoryId)) {
    return 'Please select a category.';
  }
  return undefined;
}

export function validateImageUrlEntry(url: string): string | undefined {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return 'Enter an image URL or remove this row.';
  }
  if (trimmed.length > LIMITS.imageUrlMax) {
    return `Image URL must be ${LIMITS.imageUrlMax} characters or fewer.`;
  }
  if (!isValidHttpUrl(trimmed)) {
    return 'Image URL must start with http:// or https://.';
  }
  return undefined;
}

export function validateProductBasics(values: ProductBasicsValues): ProductBasicsValidationResult {
  const fieldErrors: Partial<Record<BasicsFieldKey, string>> = {};

  const nameError = validateBasicsField('name', values);
  if (nameError) fieldErrors.name = nameError;

  const descriptionError = validateBasicsField('description', values);
  if (descriptionError) fieldErrors.description = descriptionError;

  const categoryError = validateBasicsField('categoryId', values);
  if (categoryError) fieldErrors.categoryId = categoryError;

  if (values.tags.length > LIMITS.productTagsMax) {
    fieldErrors.tags = `You can add up to ${LIMITS.productTagsMax} tags.`;
  }

  const imageErrors: Record<number, string> = {};
  if (values.imageUrls.length > LIMITS.productImagesMax) {
    fieldErrors.imageUrls = `You can add up to ${LIMITS.productImagesMax} images.`;
  } else {
    values.imageUrls.forEach((url, index) => {
      const urlErr = validateImageUrlEntry(url);
      if (urlErr) {
        imageErrors[index] = urlErr;
      }
    });
  }

  const hasErrors = Object.keys(fieldErrors).length > 0 || Object.keys(imageErrors).length > 0;

  return { fieldErrors, imageErrors, hasErrors };
}

export interface AddTagResult {
  readonly ok: boolean;
  readonly tags: readonly string[];
  readonly error?: string;
}

export function tryAddTag(existingTags: readonly string[], rawInput: string): AddTagResult {
  const normalized = normalizeTagName(rawInput);
  if (normalized.length === 0) {
    return { ok: false, tags: existingTags };
  }
  if (normalized.length > LIMITS.tagNameMax) {
    return {
      ok: false,
      tags: existingTags,
      error: `Tag must be ${LIMITS.tagNameMax} characters or fewer.`,
    };
  }
  if (existingTags.includes(normalized)) {
    return { ok: false, tags: existingTags, error: 'That tag is already added.' };
  }
  if (existingTags.length >= LIMITS.productTagsMax) {
    return {
      ok: false,
      tags: existingTags,
      error: `You can add up to ${LIMITS.productTagsMax} tags.`,
    };
  }
  return { ok: true, tags: [...existingTags, normalized] };
}

export function normalizeTagList(tags: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeTagName(tag);
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function moveListItem<T>(
  list: readonly T[],
  fromIndex: number,
  toIndex: number,
): readonly T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const item = next[fromIndex];
  if (item === undefined) {
    return list;
  }
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export interface ProductPatchDraft {
  readonly name?: string;
  readonly description?: string;
  readonly categoryId?: string;
  readonly tags?: readonly string[];
  readonly imageUrls?: readonly string[];
}

export interface ProductPatchDiff {
  readonly hasChanges: boolean;
  readonly payload: ProductPatchDraft;
}

function areStringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, index) => val === b[index]);
}

export function buildProductPatch(
  baseline: ProductBasicsValues,
  draft: ProductBasicsValues,
): ProductPatchDiff {
  const nextName = draft.name.trim();
  const baseName = baseline.name.trim();
  const nextDescription = draft.description.trim();
  const baseDescription = baseline.description.trim();
  const nextCategoryId = draft.categoryId.trim();
  const baseCategoryId = baseline.categoryId.trim();
  const nextTags = normalizeTagList(draft.tags);
  const baseTags = normalizeTagList(baseline.tags);
  const nextImages = draft.imageUrls.map((url) => url.trim());
  const baseImages = baseline.imageUrls.map((url) => url.trim());

  const payload: {
    name?: string;
    description?: string;
    categoryId?: string;
    tags?: readonly string[];
    imageUrls?: readonly string[];
  } = {};

  if (nextName !== baseName) {
    payload.name = nextName;
  }
  if (nextDescription !== baseDescription) {
    payload.description = nextDescription;
  }
  if (nextCategoryId !== baseCategoryId) {
    payload.categoryId = nextCategoryId;
  }
  if (!areStringArraysEqual(nextTags, baseTags)) {
    payload.tags = nextTags;
  }
  if (!areStringArraysEqual(nextImages, baseImages)) {
    payload.imageUrls = nextImages;
  }

  return {
    hasChanges: Object.keys(payload).length > 0,
    payload,
  };
}

export interface MappedCreateProductErrors {
  readonly basicsErrors: Partial<Record<BasicsFieldKey, string>>;
  readonly imageErrors: Readonly<Record<number, string>>;
  readonly optionErrors: Readonly<
    Record<number, { readonly name?: string; readonly values?: string }>
  >;
  readonly variantErrors: Readonly<
    Record<number, { readonly price?: string; readonly stockQuantity?: string }>
  >;
  readonly summary: readonly string[];
}

function normalizeServerKey(rawKey: string): string {
  const stripped = rawKey.startsWith('$.') ? rawKey.slice(2) : rawKey;
  return stripped.trim().toLowerCase();
}

export function mapCreateProductFieldErrors(
  fieldErrors: Readonly<Record<string, readonly string[]>>,
  optionCount: number,
  variantCount: number,
): MappedCreateProductErrors {
  const basicsErrors: Partial<Record<BasicsFieldKey, string>> = {};
  const imageErrors: Record<number, string> = {};
  const optionErrors: Record<number, { name?: string; values?: string }> = {};
  const variantErrors: Record<number, { price?: string; stockQuantity?: string }> = {};
  const summary: string[] = [];

  for (const [rawKey, messages] of Object.entries(fieldErrors)) {
    const message = messages[0];
    if (!message) continue;

    const normalized = normalizeServerKey(rawKey);
    const leaf = normalized.includes('.')
      ? normalized.slice(normalized.lastIndexOf('.') + 1)
      : normalized;

    const variantMatch = /^variants\[(\d+)\]\.(price|stockquantity|optionvalues)$/i.exec(
      normalized,
    );
    if (variantMatch) {
      const idx = Number.parseInt(variantMatch[1] ?? '', 10);
      const prop = variantMatch[2]?.toLowerCase();
      if (Number.isSafeInteger(idx) && idx >= 0 && idx < variantCount) {
        const entry = variantErrors[idx] ?? {};
        if (prop === 'price') {
          entry.price = entry.price ?? message;
          variantErrors[idx] = entry;
          continue;
        }
        if (prop === 'stockquantity') {
          entry.stockQuantity = entry.stockQuantity ?? message;
          variantErrors[idx] = entry;
          continue;
        }
      }
      summary.push(message);
      continue;
    }

    const optionMatch = /^options\[(\d+)\]\.(name|values(?:\[\d+\])?)$/i.exec(normalized);
    if (optionMatch) {
      const idx = Number.parseInt(optionMatch[1] ?? '', 10);
      const prop = optionMatch[2]?.toLowerCase() ?? '';
      if (Number.isSafeInteger(idx) && idx >= 0 && idx < optionCount) {
        const entry = optionErrors[idx] ?? {};
        if (prop === 'name') {
          entry.name = entry.name ?? message;
        } else {
          entry.values = entry.values ?? message;
        }
        optionErrors[idx] = entry;
        continue;
      }
      summary.push(message);
      continue;
    }

    const imageMatch = /^imageurls\[(\d+)\]$/i.exec(normalized);
    if (imageMatch) {
      const idx = Number.parseInt(imageMatch[1] ?? '', 10);
      if (Number.isSafeInteger(idx) && idx >= 0) {
        imageErrors[idx] = imageErrors[idx] ?? message;
        continue;
      }
    }

    const basicsKey = normalized.includes('[') ? '' : leaf;
    if (basicsKey === 'name') {
      basicsErrors.name = basicsErrors.name ?? message;
      continue;
    }
    if (basicsKey === 'description') {
      basicsErrors.description = basicsErrors.description ?? message;
      continue;
    }
    if (basicsKey === 'categoryid') {
      basicsErrors.categoryId = basicsErrors.categoryId ?? message;
      continue;
    }
    if (basicsKey === 'tags') {
      basicsErrors.tags = basicsErrors.tags ?? message;
      continue;
    }
    if (basicsKey === 'imageurls') {
      basicsErrors.imageUrls = basicsErrors.imageUrls ?? message;
      continue;
    }

    summary.push(message);
  }

  return {
    basicsErrors,
    imageErrors,
    optionErrors,
    variantErrors,
    summary,
  };
}

export function omitIndexKey<T>(
  record: Readonly<Record<number, T>>,
  indexToRemove: number,
): Record<number, T> {
  const next: Record<number, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const numKey = Number(key);
    if (numKey !== indexToRemove) {
      next[numKey] = value;
    }
  }
  return next;
}
