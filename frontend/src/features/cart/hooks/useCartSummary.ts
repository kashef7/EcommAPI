import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { getCart } from '@/api/cart.api';
import { sessionState } from '@/core/auth/session';
import {
  type CartSummaryState,
  computeCartItemCount,
  INITIAL_CART_SUMMARY,
} from '../model/cart-summary';

export const cartSummary = signal<CartSummaryState>(INITIAL_CART_SUMMARY);

let inFlightSummary: Promise<void> | null = null;
let loadedForToken: string | null = null;

export function resetCartSummary(): void {
  loadedForToken = null;
  cartSummary.value = INITIAL_CART_SUMMARY;
}

export function setCartSummaryFromItems(
  items: readonly { readonly quantity: number }[],
  totalPrice: number,
): void {
  cartSummary.value = {
    count: computeCartItemCount(items),
    totalPrice,
    status: 'loaded',
  };
}

export async function refreshCartSummary(signalArg?: AbortSignal): Promise<void> {
  const session = sessionState.value;
  if (session.status !== 'authenticated') {
    resetCartSummary();
    return;
  }

  if (inFlightSummary) {
    return inFlightSummary;
  }

  const currentToken = session.accessToken;
  cartSummary.value = {
    ...cartSummary.value,
    status: 'loading',
  };

  inFlightSummary = getCart(signalArg)
    .then((cart) => {
      if (signalArg?.aborted) {
        return;
      }
      loadedForToken = currentToken;
      setCartSummaryFromItems(cart.cartItems, cart.totalPrice);
    })
    .catch((err: unknown) => {
      if (signalArg?.aborted) {
        return;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      cartSummary.value = {
        ...cartSummary.value,
        status: 'error',
      };
    })
    .finally(() => {
      inFlightSummary = null;
    });

  return inFlightSummary;
}

export function useCartSummary(): CartSummaryState {
  const session = sessionState.value;

  useEffect(() => {
    if (session.status === 'anonymous') {
      resetCartSummary();
      return;
    }
    if (session.status !== 'authenticated') {
      return;
    }
    if (loadedForToken === session.accessToken && cartSummary.value.status === 'loaded') {
      return;
    }

    const controller = new AbortController();
    void refreshCartSummary(controller.signal);
    return () => {
      controller.abort();
    };
  }, [session.status, session.status === 'authenticated' ? session.accessToken : '']);

  return cartSummary.value;
}
