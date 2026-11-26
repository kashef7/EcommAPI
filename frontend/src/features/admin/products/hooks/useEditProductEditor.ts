import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getCategories } from '@/api/categories.api';
import {
  addOption,
  addOptionValue,
  addVariant,
  adjustVariantStock,
  deleteOption,
  deleteOptionValue,
  deleteProduct,
  deleteVariant,
  getProductById,
  renameOption,
  renameOptionValue,
  updateProduct,
  updateVariantPrice,
} from '@/api/products.api';
import { getTags } from '@/api/tags.api';
import type { AddOptionRequest, AddVariantRequest, ProductDetail } from '@/api/types';
import { invalidateResourceCache, useMutation, useResource } from '@/core/data/useResource';
import { isApiError } from '@/core/http/api-error';
import { toUserMessage } from '@/core/http/error-messages';
import { mapFieldErrors } from '@/core/http/problem-details';
import { routes } from '@/core/navigation/routes';
import { setFlashToast } from '@/core/storage/safe-storage';
import { findFirstInvalidField, setFieldError } from '@/core/validation/validators';
import type {
  AddOptionDialogFieldKey,
  AddOptionDialogResult,
} from '../../options/model/option-validation';
import type {
  AddVariantDialogFieldKey,
  AddVariantDialogResult,
} from '../../variants/model/variant-combinations';
import {
  BASICS_FIELD_ORDER,
  type BasicsFieldKey,
  buildProductPatch,
  mapCreateProductFieldErrors,
  omitIndexKey,
  type ProductBasicsValues,
  validateBasicsField,
  validateImageUrlEntry,
  validateProductBasics,
} from '../model/product-validation';

const CACHE_TTL_MS = 5 * 60_000;

function productToBasics(product: ProductDetail): ProductBasicsValues {
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    name: product.name,
    description: product.description,
    categoryId: product.category.id,
    tags: product.tags,
    imageUrls: sortedImages.map((img) => img.url),
  };
}

export function useEditProductEditor(productId: string) {
  const productResource = useResource(`admin-product:${productId}`, (signal) =>
    getProductById(productId, signal),
  );
  const categoriesResource = useResource('categories', getCategories, {
    ttlMs: CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });
  const tagsResource = useResource('tags', getTags, {
    ttlMs: CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });

  const [detailsDraft, setDetailsDraft] = useState<ProductBasicsValues | null>(null);
  const [detailsErrors, setDetailsErrors] = useState<Partial<Record<BasicsFieldKey, string>>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({});
  const [detailsFormErrors, setDetailsFormErrors] = useState<readonly string[]>([]);
  const [optionConflictBanner, setOptionConflictBanner] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const hydratedProductIdRef = useRef<string | null>(null);
  const pendingScrollRef = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const skipBeforeUnloadRef = useRef(false);

  const detailsFormRef = useRef<HTMLFormElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);

  const product = productResource.data;
  const baselineDetails = useMemo(() => (product ? productToBasics(product) : null), [product]);

  const patchDiff = useMemo(() => {
    if (!baselineDetails || !detailsDraft) {
      return { hasChanges: false, payload: {} };
    }
    return buildProductPatch(baselineDetails, detailsDraft);
  }, [baselineDetails, detailsDraft]);

  const isDirty = patchDiff.hasChanges;

  useEffect(() => {
    if (!product) return;
    if (hydratedProductIdRef.current !== product.id || !isDirty) {
      hydratedProductIdRef.current = product.id;
      setDetailsDraft(productToBasics(product));
    }
  }, [product, isDirty]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isDirty) {
      return;
    }
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (skipBeforeUnloadRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (
      productResource.status === 'success' &&
      pendingScrollRef.current &&
      typeof window !== 'undefined'
    ) {
      const saved = pendingScrollRef.current;
      pendingScrollRef.current = null;
      if (
        typeof window.requestAnimationFrame === 'function' &&
        typeof window.scrollTo === 'function'
      ) {
        window.requestAnimationFrame(() => {
          window.scrollTo(saved.x, saved.y);
        });
      }
    }
  }, [productResource.status, product]);

  const refetchPreservingScroll = useCallback(() => {
    if (typeof window !== 'undefined') {
      pendingScrollRef.current = { x: window.scrollX, y: window.scrollY };
    }
    invalidateResourceCache('products');
    productResource.reload();
  }, [productResource]);

  const saveDetailsMutation = useMutation(() => updateProduct(productId, patchDiff.payload));
  const deleteProductMutation = useMutation(() => deleteProduct(productId));

  function updateDetailsField<K extends keyof ProductBasicsValues>(
    field: K,
    nextValue: ProductBasicsValues[K],
  ) {
    if (!detailsDraft) return;
    const next = { ...detailsDraft, [field]: nextValue };
    setDetailsDraft(next);

    if (field === 'name' || field === 'description' || field === 'categoryId') {
      if (detailsErrors[field]) {
        const err = validateBasicsField(field, next);
        setDetailsErrors((prev) => setFieldError(prev, field, err));
      }
    } else if (field === 'imageUrls') {
      setImageErrors({});
      if (detailsErrors.imageUrls) {
        setDetailsErrors((prev) => setFieldError(prev, 'imageUrls', undefined));
      }
    } else if (field === 'tags' && detailsErrors.tags) {
      setDetailsErrors((prev) => setFieldError(prev, 'tags', undefined));
    }

    if (detailsFormErrors.length > 0) setDetailsFormErrors([]);
  }

  function blurDetailsField(field: 'name' | 'description' | 'categoryId') {
    if (!detailsDraft) return;
    const err = validateBasicsField(field, detailsDraft);
    setDetailsErrors((prev) => setFieldError(prev, field, err));
  }

  function blurImageRow(index: number) {
    if (!detailsDraft) return;
    const url = detailsDraft.imageUrls[index];
    if (url === undefined) return;
    const err = validateImageUrlEntry(url);
    setImageErrors((prev) => (err ? { ...prev, [index]: err } : omitIndexKey(prev, index)));
  }

  async function saveDetails(): Promise<{ readonly ok: boolean }> {
    if (!detailsDraft || !patchDiff.hasChanges || saveDetailsMutation.submitting) {
      return { ok: false };
    }

    const validation = validateProductBasics(detailsDraft);
    if (validation.hasErrors) {
      setDetailsErrors(validation.fieldErrors);
      setImageErrors(validation.imageErrors);
      setDetailsFormErrors([]);

      const firstInvalid = findFirstInvalidField(BASICS_FIELD_ORDER, validation.fieldErrors);
      if (firstInvalid === 'name') nameRef.current?.focus();
      else if (firstInvalid === 'description') descriptionRef.current?.focus();
      else if (firstInvalid === 'categoryId') categoryRef.current?.focus();
      else if (
        typeof window !== 'undefined' &&
        typeof window.requestAnimationFrame === 'function'
      ) {
        window.requestAnimationFrame(() => {
          detailsFormRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
        });
      }
      return { ok: false };
    }

    setDetailsErrors({});
    setImageErrors({});
    setDetailsFormErrors([]);

    try {
      const changedTags = patchDiff.payload.tags !== undefined;
      await saveDetailsMutation.run(undefined);
      hydratedProductIdRef.current = null;
      if (changedTags) {
        invalidateResourceCache('tags');
        tagsResource.reload();
      }
      refetchPreservingScroll();
      return { ok: true };
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapCreateProductFieldErrors(err.fieldErrors, 0, 0);
        setDetailsErrors(mapped.basicsErrors);
        setImageErrors(mapped.imageErrors);
        const hasMapped =
          Object.keys(mapped.basicsErrors).length > 0 || Object.keys(mapped.imageErrors).length > 0;
        if (mapped.summary.length > 0) {
          setDetailsFormErrors(mapped.summary);
        } else if (!hasMapped) {
          setDetailsFormErrors([toUserMessage(err)]);
        }
        return { ok: false };
      }
      setDetailsFormErrors([toUserMessage(err)]);
      return { ok: false };
    }
  }

  async function handleAddOption(payload: AddOptionRequest): Promise<AddOptionDialogResult> {
    setOptionConflictBanner(null);
    try {
      await addOption(productId, payload);
      refetchPreservingScroll();
      return { ok: true };
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapFieldErrors(err.fieldErrors, ['name', 'values', 'existingVariantsValue']);
        return {
          ok: false,
          fieldErrors: mapped.fields as Partial<Record<AddOptionDialogFieldKey, string>>,
          formErrors: mapped.summary,
        };
      }
      return { ok: false, formErrors: [toUserMessage(err)] };
    }
  }

  async function handleRenameOption(optionId: string, name: string): Promise<string | undefined> {
    try {
      await renameOption(productId, optionId, name);
      refetchPreservingScroll();
      return undefined;
    } catch (err: unknown) {
      return toUserMessage(err);
    }
  }

  async function handleDeleteOption(optionId: string): Promise<{
    readonly ok: boolean;
    readonly errorMessage?: string;
  }> {
    setOptionConflictBanner(null);
    try {
      await deleteOption(productId, optionId);
      refetchPreservingScroll();
      return { ok: true };
    } catch (err: unknown) {
      const msg = toUserMessage(err);
      if (isApiError(err) && err.status === 409) {
        setOptionConflictBanner(msg);
      }
      return { ok: false, errorMessage: msg };
    }
  }

  async function handleAddOptionValue(
    optionId: string,
    value: string,
  ): Promise<string | undefined> {
    try {
      await addOptionValue(productId, optionId, value);
      refetchPreservingScroll();
      return undefined;
    } catch (err: unknown) {
      return toUserMessage(err);
    }
  }

  async function handleRenameOptionValue(
    optionId: string,
    valueId: string,
    value: string,
  ): Promise<string | undefined> {
    try {
      await renameOptionValue(productId, optionId, valueId, value);
      refetchPreservingScroll();
      return undefined;
    } catch (err: unknown) {
      return toUserMessage(err);
    }
  }

  async function handleDeleteOptionValue(
    optionId: string,
    valueId: string,
  ): Promise<{ readonly ok: boolean; readonly errorMessage?: string }> {
    setOptionConflictBanner(null);
    try {
      await deleteOptionValue(productId, optionId, valueId);
      refetchPreservingScroll();
      return { ok: true };
    } catch (err: unknown) {
      const msg = toUserMessage(err);
      if (isApiError(err) && err.status === 409) {
        setOptionConflictBanner(msg);
      }
      return { ok: false, errorMessage: msg };
    }
  }

  async function handleSaveVariantPrice(
    variantId: string,
    price: number,
  ): Promise<{ readonly ok: boolean; readonly errorMessage?: string }> {
    try {
      await updateVariantPrice(productId, variantId, price);
      refetchPreservingScroll();
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, errorMessage: toUserMessage(err) };
    }
  }

  async function handleAdjustVariantStock(
    variantId: string,
    delta: number,
  ): Promise<{ readonly ok: boolean; readonly stock?: number; readonly errorMessage?: string }> {
    try {
      const result = await adjustVariantStock(productId, variantId, delta);
      refetchPreservingScroll();
      return { ok: true, stock: result.stock };
    } catch (err: unknown) {
      return { ok: false, errorMessage: toUserMessage(err) };
    }
  }

  async function handleAddVariant(payload: AddVariantRequest): Promise<AddVariantDialogResult> {
    try {
      await addVariant(productId, payload);
      refetchPreservingScroll();
      return { ok: true };
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapFieldErrors(err.fieldErrors, ['price', 'stockQuantity']);
        return {
          ok: false,
          fieldErrors: mapped.fields as Partial<Record<AddVariantDialogFieldKey, string>>,
          formErrors: mapped.summary,
        };
      }
      return { ok: false, formErrors: [toUserMessage(err)] };
    }
  }

  async function handleDeleteVariant(
    variantId: string,
  ): Promise<{ readonly ok: boolean; readonly errorMessage?: string }> {
    try {
      await deleteVariant(productId, variantId);
      refetchPreservingScroll();
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, errorMessage: toUserMessage(err) };
    }
  }

  async function confirmDeleteProduct(
    successToastMessage: string,
  ): Promise<{ readonly ok: boolean; readonly errorMessage?: string }> {
    if (deleteProductMutation.submitting) {
      return { ok: false };
    }
    try {
      await deleteProductMutation.run(undefined);
      skipBeforeUnloadRef.current = true;
      setDeleteDialogOpen(false);
      invalidateResourceCache('products');
      setFlashToast({ variant: 'success', message: successToastMessage });
      if (typeof window !== 'undefined') {
        window.location.assign(routes.adminProducts());
      }
      return { ok: true };
    } catch (err: unknown) {
      setDeleteDialogOpen(false);
      return { ok: false, errorMessage: toUserMessage(err) };
    }
  }

  const isNotFound =
    productResource.status === 'error' &&
    isApiError(productResource.error) &&
    productResource.error.status === 404;

  return {
    productResource,
    product,
    isNotFound,
    loadErrorMessage:
      productResource.status === 'error' ? toUserMessage(productResource.error) : null,
    categories: categoriesResource.data ?? [],
    tags: tagsResource.data ?? [],
    detailsDraft,
    detailsErrors,
    imageErrors,
    detailsFormErrors,
    isDirty,
    savingDetails: saveDetailsMutation.submitting,
    refs: {
      detailsForm: detailsFormRef,
      name: nameRef,
      description: descriptionRef,
      categoryId: categoryRef,
    },
    updateDetailsField,
    blurDetailsField,
    blurImageRow,
    saveDetails,
    optionConflictBanner,
    dismissOptionConflictBanner: () => setOptionConflictBanner(null),
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
    deletingProduct: deleteProductMutation.submitting,
    openDeleteDialog: () => setDeleteDialogOpen(true),
    closeDeleteDialog: () => {
      if (!deleteProductMutation.submitting) setDeleteDialogOpen(false);
    },
    confirmDeleteProduct,
  };
}
