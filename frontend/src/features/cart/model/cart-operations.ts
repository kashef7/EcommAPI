export type CartIssueKind = 'Unavailable' | 'OutOfStock' | 'InsufficientStock' | 'PriceChanged';

export interface CartLineItemLike {
  readonly variantId: string;
  readonly productId: string;
  readonly productName: string;
  readonly variantLabel: string;
  readonly imageUrl: string | null;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly lineTotal: number;
}

export interface CartSnapshotLike {
  readonly cartItems: readonly CartLineItemLike[];
  readonly totalPrice: number;
}

export interface CartValidationIssueLike {
  readonly variantId: string;
  readonly productName: string;
  readonly variantLabel: string;
  readonly issueTypes: readonly CartIssueKind[];
  readonly oldPrice?: number | null;
  readonly newPrice?: number | null;
  readonly availableQuantity?: number | null;
}

export interface CartValidationResultLike {
  readonly isValid: boolean;
  readonly items: readonly CartValidationIssueLike[];
}

export interface UnavailableReviewItem {
  readonly variantId: string;
  readonly productName: string;
  readonly variantLabel: string;
}

export interface RowReviewIssues {
  readonly outOfStock: boolean;
  readonly insufficientStock: number | null;
  readonly priceChange: {
    readonly oldPrice: number;
    readonly newPrice: number;
  } | null;
}

export type CartReviewState =
  | null
  | { readonly kind: 'valid' }
  | {
      readonly kind: 'issues';
      readonly unavailable: readonly UnavailableReviewItem[];
      readonly byVariantId: Readonly<Record<string, RowReviewIssues>>;
    };

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function applyOptimisticQuantity(
  cart: CartSnapshotLike,
  variantId: string,
  nextQuantity: number,
): CartSnapshotLike {
  const safeQuantity = Math.max(1, Math.floor(nextQuantity));
  const nextItems = cart.cartItems.map((item) => {
    if (item.variantId !== variantId) {
      return item;
    }
    return {
      ...item,
      quantity: safeQuantity,
      lineTotal: roundCurrency(item.unitPrice * safeQuantity),
    };
  });

  const totalPrice = roundCurrency(nextItems.reduce((sum, item) => sum + item.lineTotal, 0));
  return {
    cartItems: nextItems,
    totalPrice,
  };
}

export function applyOptimisticRemove(cart: CartSnapshotLike, variantId: string): CartSnapshotLike {
  const nextItems = cart.cartItems.filter((item) => item.variantId !== variantId);
  const totalPrice = roundCurrency(nextItems.reduce((sum, item) => sum + item.lineTotal, 0));
  return {
    cartItems: nextItems,
    totalPrice,
  };
}

export function buildCartReviewState(result: CartValidationResultLike): CartReviewState {
  if (result.isValid || result.items.length === 0) {
    return { kind: 'valid' };
  }

  const unavailable: UnavailableReviewItem[] = [];
  const byVariantId: Record<string, RowReviewIssues> = {};

  for (const item of result.items) {
    if (item.issueTypes.includes('Unavailable')) {
      unavailable.push({
        variantId: item.variantId,
        productName: item.productName,
        variantLabel: item.variantLabel,
      });
      continue;
    }

    const outOfStock = item.issueTypes.includes('OutOfStock');
    const hasInsufficientStock = item.issueTypes.includes('InsufficientStock');
    const insufficientStock =
      hasInsufficientStock &&
      typeof item.availableQuantity === 'number' &&
      Number.isFinite(item.availableQuantity)
        ? item.availableQuantity
        : null;

    const hasPriceChanged =
      item.issueTypes.includes('PriceChanged') &&
      typeof item.oldPrice === 'number' &&
      Number.isFinite(item.oldPrice) &&
      typeof item.newPrice === 'number' &&
      Number.isFinite(item.newPrice);

    const priceChange = hasPriceChanged
      ? {
          oldPrice: item.oldPrice as number,
          newPrice: item.newPrice as number,
        }
      : null;

    if (outOfStock || insufficientStock !== null || priceChange !== null) {
      byVariantId[item.variantId] = {
        outOfStock,
        insufficientStock,
        priceChange,
      };
    }
  }

  if (unavailable.length === 0 && Object.keys(byVariantId).length === 0) {
    return { kind: 'valid' };
  }

  return {
    kind: 'issues',
    unavailable,
    byVariantId,
  };
}

export function clearVariantFromReviewState(
  review: CartReviewState,
  variantId: string,
): CartReviewState {
  if (!review) {
    return null;
  }
  if (review.kind === 'valid') {
    return null;
  }

  const nextByVariantId: Record<string, RowReviewIssues> = {};
  for (const [key, entry] of Object.entries(review.byVariantId)) {
    if (key !== variantId) {
      nextByVariantId[key] = entry;
    }
  }

  if (review.unavailable.length === 0 && Object.keys(nextByVariantId).length === 0) {
    return null;
  }

  return {
    kind: 'issues',
    unavailable: review.unavailable,
    byVariantId: nextByVariantId,
  };
}

export function clearStockIssueFromReviewState(
  review: CartReviewState,
  variantId: string,
): CartReviewState {
  if (!review) {
    return null;
  }
  if (review.kind === 'valid') {
    return null;
  }

  const currentRow = review.byVariantId[variantId];
  if (!currentRow) {
    return review;
  }

  const nextByVariantId: Record<string, RowReviewIssues> = {};
  for (const [key, entry] of Object.entries(review.byVariantId)) {
    if (key !== variantId) {
      nextByVariantId[key] = entry;
    } else if (entry.priceChange !== null) {
      nextByVariantId[key] = {
        outOfStock: false,
        insufficientStock: null,
        priceChange: entry.priceChange,
      };
    }
  }

  if (review.unavailable.length === 0 && Object.keys(nextByVariantId).length === 0) {
    return null;
  }

  return {
    kind: 'issues',
    unavailable: review.unavailable,
    byVariantId: nextByVariantId,
  };
}
