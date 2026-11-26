import { useRef, useState } from 'preact/hooks';
import { getCategories } from '@/api/categories.api';
import { createProduct } from '@/api/products.api';
import { getTags } from '@/api/tags.api';
import type { CreateProductRequest, ProductDetail } from '@/api/types';
import { invalidateResourceCache, useMutation, useResource } from '@/core/data/useResource';
import { isApiError } from '@/core/http/api-error';
import { toUserMessage } from '@/core/http/error-messages';
import { routes } from '@/core/navigation/routes';
import { setFlashToast } from '@/core/storage/safe-storage';
import {
  findFirstInvalidField,
  setFieldError,
  validatePriceValue,
  validateStockValue,
} from '@/core/validation/validators';
import {
  type OptionDraft,
  type OptionDraftError,
  validateCreateOptionsList,
} from '../../options/model/option-validation';
import {
  areVariantDraftsSyncedWithOptions,
  countCartesianCombinations,
  exceedsCombinationGuard,
  generateVariantDrafts,
  type VariantDraftRow,
} from '../../variants/model/variant-combinations';
import type { VariantRowError } from '../../variants/components/CreateVariantsSection';
import {
  BASICS_FIELD_ORDER,
  type BasicsFieldKey,
  mapCreateProductFieldErrors,
  normalizeTagList,
  omitIndexKey,
  type ProductBasicsValues,
  validateBasicsField,
  validateImageUrlEntry,
  validateProductBasics,
} from '../model/product-validation';

const CACHE_TTL_MS = 5 * 60_000;

const INITIAL_BASICS: ProductBasicsValues = {
  name: '',
  description: '',
  categoryId: '',
  tags: [],
  imageUrls: [],
};

export interface CreateSubmitOutcome {
  readonly ok: boolean;
  readonly product?: ProductDetail;
}

export function useCreateProductEditor(successToastMessage: string) {
  const categoriesResource = useResource('categories', getCategories, {
    ttlMs: CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });
  const tagsResource = useResource('tags', getTags, {
    ttlMs: CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });

  const [basics, setBasics] = useState<ProductBasicsValues>(INITIAL_BASICS);
  const [basicsErrors, setBasicsErrors] = useState<Partial<Record<BasicsFieldKey, string>>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({});

  const [options, setOptions] = useState<readonly OptionDraft[]>([]);
  const [optionErrors, setOptionErrors] = useState<Readonly<Record<number, OptionDraftError>>>({});

  const [singleVariant, setSingleVariant] = useState({ price: '', stockQuantity: '0' });
  const [singleVariantError, setSingleVariantError] = useState<VariantRowError>({});
  const [variants, setVariants] = useState<readonly VariantDraftRow[]>([]);
  const [variantErrors, setVariantErrors] = useState<Readonly<Record<number, VariantRowError>>>({});
  const [variantsSectionError, setVariantsSectionError] = useState<string | undefined>(undefined);

  const [pendingConfirmCount, setPendingConfirmCount] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<readonly string[]>([]);
  const [redirecting, setRedirecting] = useState(false);

  const optionIdSeqRef = useRef(1);
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);
  const generateButtonRef = useRef<HTMLButtonElement | null>(null);

  const createMutation = useMutation((payload: CreateProductRequest) => createProduct(payload));

  function updateBasicsField<K extends keyof ProductBasicsValues>(
    field: K,
    nextValue: ProductBasicsValues[K],
  ) {
    const next = { ...basics, [field]: nextValue };
    setBasics(next);

    if (field === 'name' || field === 'description' || field === 'categoryId') {
      if (basicsErrors[field]) {
        const err = validateBasicsField(field, next);
        setBasicsErrors((prev) => setFieldError(prev, field, err));
      }
    } else if (field === 'imageUrls') {
      setImageErrors({});
      if (basicsErrors.imageUrls) {
        setBasicsErrors((prev) => setFieldError(prev, 'imageUrls', undefined));
      }
    } else if (field === 'tags' && basicsErrors.tags) {
      setBasicsErrors((prev) => setFieldError(prev, 'tags', undefined));
    }

    if (formErrors.length > 0) setFormErrors([]);
  }

  function blurBasicsField(field: 'name' | 'description' | 'categoryId') {
    const err = validateBasicsField(field, basics);
    setBasicsErrors((prev) => setFieldError(prev, field, err));
  }

  function blurImageRow(index: number) {
    const url = basics.imageUrls[index];
    if (url === undefined) return;
    const err = validateImageUrlEntry(url);
    setImageErrors((prev) => (err ? { ...prev, [index]: err } : omitIndexKey(prev, index)));
  }

  function addOption() {
    const id = `opt-${optionIdSeqRef.current}`;
    optionIdSeqRef.current += 1;
    setOptions((prev) => [...prev, { localId: id, name: '', values: [] }]);
    setVariantsSectionError(undefined);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
    setOptionErrors({});
    setVariantsSectionError(undefined);
  }

  function renameOption(index: number, name: string) {
    setOptions((prev) => prev.map((opt, idx) => (idx === index ? { ...opt, name } : opt)));
    setOptionErrors((prev) => {
      const current = prev[index];
      if (!current?.name) return prev;
      if (current.values) {
        return { ...prev, [index]: { values: current.values } };
      }
      return omitIndexKey(prev, index);
    });
    setVariantsSectionError(undefined);
  }

  function changeOptionValues(index: number, values: readonly string[]) {
    setOptions((prev) => prev.map((opt, idx) => (idx === index ? { ...opt, values } : opt)));
    setOptionErrors((prev) => {
      const current = prev[index];
      if (!current?.values) return prev;
      if (current.name) {
        return { ...prev, [index]: { name: current.name } };
      }
      return omitIndexKey(prev, index);
    });
    setVariantsSectionError(undefined);
  }

  function applyGeneratedCombinations() {
    const nextDrafts = generateVariantDrafts(options, variants);
    setVariants(nextDrafts);
    setVariantErrors({});
    setVariantsSectionError(undefined);
  }

  function requestGenerateCombinations() {
    const optErrs = validateCreateOptionsList(options);
    if (Object.keys(optErrs).length > 0) {
      setOptionErrors(optErrs);
      return;
    }
    setOptionErrors({});
    const count = countCartesianCombinations(options);
    if (exceedsCombinationGuard(count)) {
      setPendingConfirmCount(count);
      return;
    }
    applyGeneratedCombinations();
  }

  function confirmGenerateMany() {
    setPendingConfirmCount(null);
    applyGeneratedCombinations();
  }

  function cancelGenerateMany() {
    setPendingConfirmCount(null);
  }

  function updateSingleVariant(field: 'price' | 'stockQuantity', value: string) {
    const next = { ...singleVariant, [field]: value };
    setSingleVariant(next);
    if (singleVariantError[field]) {
      const err = field === 'price' ? validatePriceValue(value) : validateStockValue(value);
      setSingleVariantError((prev) => setFieldError(prev, field, err));
    }
    if (variantsSectionError) setVariantsSectionError(undefined);
  }

  function blurSingleVariant(field: 'price' | 'stockQuantity') {
    const err =
      field === 'price'
        ? validatePriceValue(singleVariant.price)
        : validateStockValue(singleVariant.stockQuantity);
    setSingleVariantError((prev) => setFieldError(prev, field, err));
  }

  function updateVariantRow(index: number, field: 'price' | 'stockQuantity', value: string) {
    setVariants((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)),
    );
    if (variantErrors[index]?.[field]) {
      const err = field === 'price' ? validatePriceValue(value) : validateStockValue(value);
      setVariantErrors((prev) => {
        const currentRowErr = prev[index] ?? {};
        const nextRowErr = setFieldError(currentRowErr, field, err);
        if (nextRowErr.price || nextRowErr.stockQuantity) {
          return { ...prev, [index]: nextRowErr };
        }
        return omitIndexKey(prev, index);
      });
    }
  }

  function blurVariantRow(index: number, field: 'price' | 'stockQuantity') {
    const row = variants[index];
    if (!row) return;
    const err =
      field === 'price' ? validatePriceValue(row.price) : validateStockValue(row.stockQuantity);
    setVariantErrors((prev) => {
      const currentRowErr = prev[index] ?? {};
      const nextRowErr = setFieldError(currentRowErr, field, err);
      if (nextRowErr.price || nextRowErr.stockQuantity) {
        return { ...prev, [index]: nextRowErr };
      }
      return omitIndexKey(prev, index);
    });
  }

  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
    setVariantErrors({});
  }

  function applyPriceToAll(price: string) {
    setVariants((prev) => prev.map((row) => ({ ...row, price })));
    setVariantErrors((prev) => {
      const next: Record<number, VariantRowError> = {};
      for (const [idxStr, rowErr] of Object.entries(prev)) {
        if (rowErr.stockQuantity) {
          next[Number(idxStr)] = { stockQuantity: rowErr.stockQuantity };
        }
      }
      return next;
    });
  }

  function applyStockToAll(stockQuantity: string) {
    setVariants((prev) => prev.map((row) => ({ ...row, stockQuantity })));
    setVariantErrors((prev) => {
      const next: Record<number, VariantRowError> = {};
      for (const [idxStr, rowErr] of Object.entries(prev)) {
        if (rowErr.price) {
          next[Number(idxStr)] = { price: rowErr.price };
        }
      }
      return next;
    });
  }

  function focusFirstInvalid(firstBasicsKey: BasicsFieldKey | null, shouldFocusGenerate: boolean) {
    if (firstBasicsKey === 'name') {
      nameRef.current?.focus();
      return;
    }
    if (firstBasicsKey === 'description') {
      descriptionRef.current?.focus();
      return;
    }
    if (firstBasicsKey === 'categoryId') {
      categoryRef.current?.focus();
      return;
    }
    if (shouldFocusGenerate) {
      generateButtonRef.current?.focus();
      return;
    }
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        const firstInvalidControl =
          formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        firstInvalidControl?.focus();
      });
    }
  }

  async function submitCreate(): Promise<CreateSubmitOutcome> {
    if (createMutation.submitting || redirecting) {
      return { ok: false };
    }

    const basicsValidation = validateProductBasics(basics);
    const optValidation = options.length > 0 ? validateCreateOptionsList(options) : {};
    const hasOptions = options.length > 0;

    let nextSingleErr: VariantRowError = {};
    const nextVariantErrs: Record<number, VariantRowError> = {};
    let nextVariantsSectionErr: string | undefined;
    let shouldFocusGenerate = false;

    if (!hasOptions) {
      const pErr = validatePriceValue(singleVariant.price);
      const sErr = validateStockValue(singleVariant.stockQuantity);
      if (pErr) nextSingleErr = { ...nextSingleErr, price: pErr };
      if (sErr) nextSingleErr = { ...nextSingleErr, stockQuantity: sErr };
    } else if (variants.length === 0) {
      nextVariantsSectionErr = 'Generate combinations to create at least one variant.';
      shouldFocusGenerate = true;
    } else if (!areVariantDraftsSyncedWithOptions(options, variants)) {
      nextVariantsSectionErr =
        'Options changed. Click Generate combinations to update the variant rows.';
      shouldFocusGenerate = true;
    } else {
      variants.forEach((row, index) => {
        const pErr = validatePriceValue(row.price);
        const sErr = validateStockValue(row.stockQuantity);
        if (pErr || sErr) {
          nextVariantErrs[index] = {
            ...(pErr ? { price: pErr } : {}),
            ...(sErr ? { stockQuantity: sErr } : {}),
          };
        }
      });
    }

    const hasVariantProblems =
      Boolean(nextSingleErr.price || nextSingleErr.stockQuantity) ||
      Boolean(nextVariantsSectionErr) ||
      Object.keys(nextVariantErrs).length > 0;

    if (basicsValidation.hasErrors || Object.keys(optValidation).length > 0 || hasVariantProblems) {
      setBasicsErrors(basicsValidation.fieldErrors);
      setImageErrors(basicsValidation.imageErrors);
      setOptionErrors(optValidation);
      setSingleVariantError(nextSingleErr);
      setVariantErrors(nextVariantErrs);
      setVariantsSectionError(nextVariantsSectionErr);
      setFormErrors([]);

      const firstBasics = findFirstInvalidField(BASICS_FIELD_ORDER, basicsValidation.fieldErrors);
      focusFirstInvalid(firstBasics, shouldFocusGenerate);
      return { ok: false };
    }

    setBasicsErrors({});
    setImageErrors({});
    setOptionErrors({});
    setSingleVariantError({});
    setVariantErrors({});
    setVariantsSectionError(undefined);
    setFormErrors([]);

    const cleanedTags = normalizeTagList(basics.tags);
    const cleanedImages = basics.imageUrls.map((url) => url.trim());

    const payload: CreateProductRequest = {
      name: basics.name.trim(),
      description: basics.description.trim(),
      categoryId: basics.categoryId,
      ...(cleanedTags.length > 0 ? { tags: cleanedTags } : {}),
      ...(cleanedImages.length > 0 ? { imageUrls: cleanedImages } : {}),
      ...(hasOptions
        ? {
            options: options.map((opt) => ({
              name: opt.name.trim(),
              values: opt.values.map((v) => v.trim()),
            })),
            variants: variants.map((row) => ({
              optionValues: row.optionValues,
              price: Number(row.price.trim()),
              stockQuantity: Number.parseInt(row.stockQuantity.trim(), 10),
            })),
          }
        : {
            variants: [
              {
                price: Number(singleVariant.price.trim()),
                stockQuantity: Number.parseInt(singleVariant.stockQuantity.trim(), 10),
              },
            ],
          }),
    };

    try {
      const created = await createMutation.run(payload);
      setRedirecting(true);
      invalidateResourceCache('products');
      invalidateResourceCache('tags');
      setFlashToast({ variant: 'success', message: successToastMessage });
      if (typeof window !== 'undefined') {
        window.location.assign(routes.adminProductEditor(created.id));
      }
      return { ok: true, product: created };
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapCreateProductFieldErrors(
          err.fieldErrors,
          options.length,
          hasOptions ? variants.length : 1,
        );
        setBasicsErrors(mapped.basicsErrors);
        setImageErrors(mapped.imageErrors);
        setOptionErrors(mapped.optionErrors);
        if (!hasOptions) {
          setSingleVariantError(mapped.variantErrors[0] ?? {});
        } else {
          setVariantErrors(mapped.variantErrors);
        }

        const hasMappedInputs =
          Object.keys(mapped.basicsErrors).length > 0 ||
          Object.keys(mapped.imageErrors).length > 0 ||
          Object.keys(mapped.optionErrors).length > 0 ||
          Object.keys(mapped.variantErrors).length > 0;

        if (mapped.summary.length > 0) {
          setFormErrors(mapped.summary);
        } else if (!hasMappedInputs) {
          setFormErrors([toUserMessage(err)]);
        }

        const firstBasics = findFirstInvalidField(BASICS_FIELD_ORDER, mapped.basicsErrors);
        focusFirstInvalid(firstBasics, false);
        return { ok: false };
      }

      setFormErrors([toUserMessage(err)]);
      return { ok: false };
    }
  }

  return {
    categories: categoriesResource.data ?? [],
    tags: tagsResource.data ?? [],
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
    submitting: createMutation.submitting || redirecting,
    refs: {
      form: formRef,
      name: nameRef,
      description: descriptionRef,
      categoryId: categoryRef,
      generateButton: generateButtonRef,
    },
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
  };
}
