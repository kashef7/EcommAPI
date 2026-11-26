export interface CartSummaryState {
  readonly count: number;
  readonly totalPrice: number;
  readonly status: 'idle' | 'loading' | 'loaded' | 'error';
}

export const INITIAL_CART_SUMMARY: CartSummaryState = {
  count: 0,
  totalPrice: 0,
  status: 'idle',
};

export const CART_BADGE_CAP = 99;

export function computeCartItemCount(items: readonly { readonly quantity: number }[]): number {
  let total = 0;
  for (const item of items) {
    if (Number.isFinite(item.quantity) && item.quantity > 0) {
      total += Math.floor(item.quantity);
    }
  }
  return total;
}

export function formatCartBadgeCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }
  const normalized = Math.floor(count);
  if (normalized > CART_BADGE_CAP) {
    return `${CART_BADGE_CAP}+`;
  }
  return String(normalized);
}
