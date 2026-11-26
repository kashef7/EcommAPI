import { describe, expect, it } from 'vitest';
import {
  applyOptimisticQuantity,
  applyOptimisticRemove,
  buildCartReviewState,
  type CartSnapshotLike,
  clearStockIssueFromReviewState,
  clearVariantFromReviewState,
} from './cart-operations';

const SAMPLE_CART: CartSnapshotLike = {
  cartItems: [
    {
      variantId: 'v1',
      productId: 'p1',
      productName: 'Linen Notebook',
      variantLabel: 'Size: A5',
      imageUrl: null,
      unitPrice: 14.5,
      quantity: 2,
      lineTotal: 29,
    },
    {
      variantId: 'v2',
      productId: 'p2',
      productName: 'Brass Pen',
      variantLabel: '',
      imageUrl: null,
      unitPrice: 20,
      quantity: 1,
      lineTotal: 20,
    },
  ],
  totalPrice: 49,
};

describe('cart-operations model', () => {
  it('computes optimistic quantity and removal totals accurately', () => {
    const updated = applyOptimisticQuantity(SAMPLE_CART, 'v1', 3);
    expect(updated.cartItems[0]?.quantity).toBe(3);
    expect(updated.cartItems[0]?.lineTotal).toBe(43.5);
    expect(updated.totalPrice).toBe(63.5);

    const removed = applyOptimisticRemove(updated, 'v2');
    expect(removed.cartItems).toHaveLength(1);
    expect(removed.totalPrice).toBe(43.5);
  });

  it('maps cart validation results including combined PriceChanged + stock issues and Unavailable', () => {
    expect(buildCartReviewState({ isValid: true, items: [] })).toEqual({ kind: 'valid' });

    const review = buildCartReviewState({
      isValid: false,
      items: [
        {
          variantId: 'v-removed',
          productName: 'Retired Ink',
          variantLabel: '',
          issueTypes: ['Unavailable'],
        },
        {
          variantId: 'v1',
          productName: 'Linen Notebook',
          variantLabel: 'Size: A5',
          issueTypes: ['PriceChanged', 'InsufficientStock'],
          oldPrice: 14.5,
          newPrice: 16,
          availableQuantity: 2,
        },
        {
          variantId: 'v2',
          productName: 'Brass Pen',
          variantLabel: '',
          issueTypes: ['PriceChanged', 'OutOfStock'],
          oldPrice: 20,
          newPrice: 22,
          availableQuantity: 0,
        },
      ],
    });

    expect(review).toEqual({
      kind: 'issues',
      unavailable: [{ variantId: 'v-removed', productName: 'Retired Ink', variantLabel: '' }],
      byVariantId: {
        v1: {
          outOfStock: false,
          insufficientStock: 2,
          priceChange: { oldPrice: 14.5, newPrice: 16 },
        },
        v2: {
          outOfStock: true,
          insufficientStock: null,
          priceChange: { oldPrice: 20, newPrice: 22 },
        },
      },
    });

    const afterStockFix = clearStockIssueFromReviewState(review, 'v1');
    expect(afterStockFix?.kind).toBe('issues');
    if (afterStockFix?.kind === 'issues') {
      expect(afterStockFix.byVariantId['v1']).toEqual({
        outOfStock: false,
        insufficientStock: null,
        priceChange: { oldPrice: 14.5, newPrice: 16 },
      });
    }

    const afterRemove = clearVariantFromReviewState(afterStockFix, 'v2');
    expect(afterRemove?.kind).toBe('issues');
    if (afterRemove?.kind === 'issues') {
      expect(afterRemove.byVariantId['v2']).toBeUndefined();
    }
  });
});
