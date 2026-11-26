import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { addCartItem } from '@/api/cart.api';
import { getProductById } from '@/api/products.api';
import { sessionState } from '@/core/auth/session';
import { useMutation, useResource } from '@/core/data/useResource';
import { isApiError } from '@/core/http/api-error';
import { toUserMessage } from '@/core/http/error-messages';
import { getCurrentRelativeUrl, routes } from '@/core/navigation/routes';
import { isValidGuid } from '@/core/validation/validators';
import {
  buildInitialSelection,
  computeOptionAvailability,
  getSortedImages,
  type OptionSelectionMap,
  resolveSelectedVariant,
} from '../model/variant-selection';

const ADDED_FEEDBACK_MS = 1500;

export type AddToCartOutcome =
  | { readonly kind: 'redirected' }
  | { readonly kind: 'success' }
  | { readonly kind: 'inline-error' }
  | { readonly kind: 'toast-error'; readonly message: string }
  | { readonly kind: 'ignored' };

function readProductIdFromLocation(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('id')?.trim() ?? '';
}

export function useProductPage() {
  const productId = useMemo(readProductIdFromLocation, []);
  const hasValidId = isValidGuid(productId);

  const productResource = useResource(
    hasValidId ? `product:${productId}` : null,
    (signal) => getProductById(productId, signal),
    { enabled: hasValidId },
  );

  const product = productResource.data;
  const [selectionState, setSelectionState] = useState<{
    readonly productId: string;
    readonly values: OptionSelectionMap;
  }>({ productId: '', values: {} });
  const [quantity, setQuantity] = useState(1);
  const [addedJustNow, setAddedJustNow] = useState(false);
  const [inlineCartError, setInlineCartError] = useState<string | null>(null);

  const addedTimerRef = useRef<number | null>(null);
  const addMutation = useMutation(
    ({ variantId, qty }: { readonly variantId: string; readonly qty: number }) =>
      addCartItem(variantId, qty),
  );

  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  const selection = useMemo(() => {
    if (!product) {
      return {};
    }
    if (selectionState.productId === product.id) {
      return selectionState.values;
    }
    return buildInitialSelection(product.options, product.variants);
  }, [product, selectionState]);

  const sortedImages = useMemo(() => (product ? getSortedImages(product.images) : []), [product]);

  const selectedVariant = useMemo(
    () => (product ? resolveSelectedVariant(product.options, product.variants, selection) : null),
    [product, selection],
  );

  const optionAvailability = useMemo(
    () => (product ? computeOptionAvailability(product.options, product.variants, selection) : {}),
    [product, selection],
  );

  useEffect(() => {
    if (!selectedVariant) {
      return;
    }
    if (selectedVariant.stockQuantity > 0) {
      setQuantity((prev) => Math.min(Math.max(1, prev), selectedVariant.stockQuantity));
    } else {
      setQuantity(1);
    }
    setInlineCartError(null);
  }, [selectedVariant]);

  function selectOption(optionName: string, value: string) {
    if (!product) {
      return;
    }
    setSelectionState({
      productId: product.id,
      values: {
        ...selection,
        [optionName]: value,
      },
    });
    setInlineCartError(null);
  }

  function handleQuantityChange(nextQuantity: number) {
    setQuantity(nextQuantity);
    if (inlineCartError !== null) {
      setInlineCartError(null);
    }
  }

  async function submitAddToCart(): Promise<AddToCartOutcome> {
    if (addMutation.submitting) {
      return { kind: 'ignored' };
    }

    const session = sessionState.value;
    if (session.status === 'anonymous') {
      if (typeof window !== 'undefined') {
        window.location.assign(routes.login(getCurrentRelativeUrl()));
      }
      return { kind: 'redirected' };
    }

    if (session.status !== 'authenticated') {
      return { kind: 'ignored' };
    }

    if (!selectedVariant || selectedVariant.stockQuantity <= 0) {
      return { kind: 'ignored' };
    }

    setInlineCartError(null);

    try {
      await addMutation.run({ variantId: selectedVariant.id, qty: quantity });

      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
      setAddedJustNow(true);
      addedTimerRef.current = window.setTimeout(() => {
        setAddedJustNow(false);
        addedTimerRef.current = null;
      }, ADDED_FEEDBACK_MS);

      return { kind: 'success' };
    } catch (err: unknown) {
      if (isApiError(err) && err.status === 409) {
        setInlineCartError(toUserMessage(err));
        return { kind: 'inline-error' };
      }
      return { kind: 'toast-error', message: toUserMessage(err) };
    }
  }

  const isNotFound =
    !hasValidId ||
    (productResource.status === 'error' &&
      isApiError(productResource.error) &&
      productResource.error.status === 404);

  return {
    hasValidId,
    isNotFound,
    productResource,
    productErrorMessage:
      productResource.status === 'error' ? toUserMessage(productResource.error) : null,
    sortedImages,
    selection,
    selectedVariant,
    optionAvailability,
    quantity,
    setQuantity: handleQuantityChange,
    selectOption,
    submittingAdd: addMutation.submitting,
    addedJustNow,
    inlineCartError,
    submitAddToCart,
    sessionStatus: sessionState.value.status,
  };
}
