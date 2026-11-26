import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  clearCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
  validateCart,
} from '@/api/cart.api';
import { usePageAccess } from '@/core/auth/usePageAccess';
import { useMutation, useResource } from '@/core/data/useResource';
import { toUserMessage } from '@/core/http/error-messages';
import {
  applyOptimisticQuantity,
  applyOptimisticRemove,
  buildCartReviewState,
  type CartReviewState,
  type CartSnapshotLike,
  clearStockIssueFromReviewState,
  clearVariantFromReviewState,
} from '../model/cart-operations';
import { setCartSummaryFromItems } from './useCartSummary';

const QUANTITY_DEBOUNCE_MS = 400;

export interface CartActionOutcome {
  readonly ok: boolean;
  readonly errorMessage?: string;
}

export function useCartPage(onActionError?: (message: string) => void) {
  const access = usePageAccess('authenticated');
  const cartResource = useResource(access === 'allowed' ? 'cart:page' : null, getCart, {
    enabled: access === 'allowed',
  });

  const [cart, setCart] = useState<CartSnapshotLike | undefined>(undefined);
  const [reviewState, setReviewState] = useState<CartReviewState>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [removingVariantIds, setRemovingVariantIds] = useState<ReadonlySet<string>>(new Set());

  const cartRef = useRef<CartSnapshotLike | undefined>(undefined);
  cartRef.current = cart;

  const qtyTimersRef = useRef(new Map<string, number>());
  const qtyBaselinesRef = useRef(new Map<string, CartSnapshotLike>());
  const qtySeqRef = useRef(new Map<string, number>());
  const reconcileSeqRef = useRef(0);
  const onErrorRef = useRef(onActionError);
  onErrorRef.current = onActionError;

  const clearMutation = useMutation(() => clearCart());
  const reviewMutation = useMutation(() => validateCart());

  useEffect(() => {
    if (!cartResource.data) {
      return;
    }
    setCart(cartResource.data);
    setCartSummaryFromItems(cartResource.data.cartItems, cartResource.data.totalPrice);
  }, [cartResource.data]);

  useEffect(() => {
    const timers = qtyTimersRef.current;
    return () => {
      for (const timerId of timers.values()) {
        window.clearTimeout(timerId);
      }
      timers.clear();
    };
  }, []);

  const syncCartState = useCallback((next: CartSnapshotLike) => {
    setCart(next);
    setCartSummaryFromItems(next.cartItems, next.totalPrice);
  }, []);

  const reconcileFromServer = useCallback(async () => {
    reconcileSeqRef.current += 1;
    const seq = reconcileSeqRef.current;
    try {
      const fresh = await getCart();
      if (seq !== reconcileSeqRef.current || qtyTimersRef.current.size > 0) {
        return;
      }
      syncCartState(fresh);
    } catch {
      // Keep the latest valid/rolled-back UI state if silent reconcile fails.
    }
  }, [syncCartState]);

  const cancelPendingQuantityTimer = useCallback((variantId: string) => {
    const timer = qtyTimersRef.current.get(variantId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      qtyTimersRef.current.delete(variantId);
    }
  }, []);

  const changeQuantity = useCallback(
    (variantId: string, nextQuantity: number) => {
      const current = cartRef.current;
      if (!current) {
        return;
      }

      if (!qtyBaselinesRef.current.has(variantId)) {
        qtyBaselinesRef.current.set(variantId, current);
      }

      cancelPendingQuantityTimer(variantId);

      const optimistic = applyOptimisticQuantity(current, variantId, nextQuantity);
      syncCartState(optimistic);
      setReviewState((prev) => clearStockIssueFromReviewState(prev, variantId));

      const nextSeq = (qtySeqRef.current.get(variantId) ?? 0) + 1;
      qtySeqRef.current.set(variantId, nextSeq);

      const timerId = window.setTimeout(() => {
        qtyTimersRef.current.delete(variantId);

        void updateCartItemQuantity(variantId, Math.max(1, Math.floor(nextQuantity)))
          .then(async () => {
            if (qtySeqRef.current.get(variantId) !== nextSeq) {
              return;
            }
            qtyBaselinesRef.current.delete(variantId);
            await reconcileFromServer();
          })
          .catch(async (err: unknown) => {
            if (qtySeqRef.current.get(variantId) !== nextSeq) {
              return;
            }
            const baseline = qtyBaselinesRef.current.get(variantId);
            qtyBaselinesRef.current.delete(variantId);
            if (baseline) {
              syncCartState(baseline);
            }
            onErrorRef.current?.(toUserMessage(err));
            await reconcileFromServer();
          });
      }, QUANTITY_DEBOUNCE_MS);

      qtyTimersRef.current.set(variantId, timerId);
    },
    [cancelPendingQuantityTimer, reconcileFromServer, syncCartState],
  );

  const setExactQuantity = useCallback(
    async (variantId: string, quantity: number): Promise<CartActionOutcome> => {
      const current = cartRef.current;
      if (!current) {
        return { ok: false };
      }

      cancelPendingQuantityTimer(variantId);
      const baseline = qtyBaselinesRef.current.get(variantId) ?? current;
      qtyBaselinesRef.current.delete(variantId);
      qtySeqRef.current.set(variantId, (qtySeqRef.current.get(variantId) ?? 0) + 1);

      const optimistic = applyOptimisticQuantity(current, variantId, quantity);
      syncCartState(optimistic);
      setReviewState((prev) => clearStockIssueFromReviewState(prev, variantId));

      try {
        await updateCartItemQuantity(variantId, Math.max(1, Math.floor(quantity)));
        await reconcileFromServer();
        return { ok: true };
      } catch (err: unknown) {
        syncCartState(baseline);
        const message = toUserMessage(err);
        onErrorRef.current?.(message);
        await reconcileFromServer();
        return { ok: false, errorMessage: message };
      }
    },
    [cancelPendingQuantityTimer, reconcileFromServer, syncCartState],
  );

  const removeItem = useCallback(
    async (variantId: string): Promise<CartActionOutcome> => {
      const current = cartRef.current;
      if (!current || removingVariantIds.has(variantId)) {
        return { ok: false };
      }

      cancelPendingQuantityTimer(variantId);
      const baseline = qtyBaselinesRef.current.get(variantId) ?? current;
      qtyBaselinesRef.current.delete(variantId);
      qtySeqRef.current.set(variantId, (qtySeqRef.current.get(variantId) ?? 0) + 1);

      setRemovingVariantIds((prev) => new Set([...prev, variantId]));
      syncCartState(applyOptimisticRemove(current, variantId));
      setReviewState((prev) => clearVariantFromReviewState(prev, variantId));

      try {
        await removeCartItem(variantId);
        await reconcileFromServer();
        return { ok: true };
      } catch (err: unknown) {
        syncCartState(baseline);
        const message = toUserMessage(err);
        onErrorRef.current?.(message);
        await reconcileFromServer();
        return { ok: false, errorMessage: message };
      } finally {
        setRemovingVariantIds((prev) => {
          const next = new Set(prev);
          next.delete(variantId);
          return next;
        });
      }
    },
    [cancelPendingQuantityTimer, reconcileFromServer, removingVariantIds, syncCartState],
  );

  const confirmClearCart = useCallback(async (): Promise<CartActionOutcome> => {
    if (clearMutation.submitting) {
      return { ok: false };
    }

    for (const timerId of qtyTimersRef.current.values()) {
      window.clearTimeout(timerId);
    }
    qtyTimersRef.current.clear();
    qtyBaselinesRef.current.clear();

    try {
      await clearMutation.run(undefined);
      syncCartState({ cartItems: [], totalPrice: 0 });
      setReviewState(null);
      setClearDialogOpen(false);
      await reconcileFromServer();
      return { ok: true };
    } catch (err: unknown) {
      setClearDialogOpen(false);
      const message = toUserMessage(err);
      onErrorRef.current?.(message);
      await reconcileFromServer();
      return { ok: false, errorMessage: message };
    }
  }, [clearMutation, reconcileFromServer, syncCartState]);

  const runReviewCart = useCallback(async (): Promise<CartActionOutcome> => {
    if (reviewMutation.submitting) {
      return { ok: false };
    }

    for (const [variantId, timerId] of qtyTimersRef.current.entries()) {
      window.clearTimeout(timerId);
      qtySeqRef.current.set(variantId, (qtySeqRef.current.get(variantId) ?? 0) + 1);
    }
    qtyTimersRef.current.clear();
    qtyBaselinesRef.current.clear();

    try {
      const validationResult = await reviewMutation.run(undefined);
      const nextReview = buildCartReviewState(validationResult);
      setReviewState(nextReview);
      await reconcileFromServer();
      return { ok: true };
    } catch (err: unknown) {
      const message = toUserMessage(err);
      onErrorRef.current?.(message);
      return { ok: false, errorMessage: message };
    }
  }, [reconcileFromServer, reviewMutation]);

  return {
    access,
    cart,
    loadStatus: cartResource.status,
    loadErrorMessage: cartResource.status === 'error' ? toUserMessage(cartResource.error) : null,
    reloadCart: cartResource.reload,
    reviewState,
    dismissReview: () => setReviewState(null),
    clearDialogOpen,
    openClearDialog: () => setClearDialogOpen(true),
    closeClearDialog: () => setClearDialogOpen(false),
    clearing: clearMutation.submitting,
    reviewing: reviewMutation.submitting,
    removingVariantIds,
    changeQuantity,
    setExactQuantity,
    removeItem,
    confirmClearCart,
    runReviewCart,
  };
}
