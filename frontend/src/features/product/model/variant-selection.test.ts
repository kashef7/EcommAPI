import { describe, expect, it } from 'vitest';
import {
  buildInitialSelection,
  computeOptionAvailability,
  findInitialVariant,
  getSortedImages,
  type ProductOptionLike,
  type ProductVariantLike,
  resolveSelectedVariant,
} from './variant-selection';

const OPTIONS: readonly ProductOptionLike[] = [
  {
    id: 'opt-size',
    name: 'Size',
    values: [
      { id: 'v-s', value: 'Small' },
      { id: 'v-m', value: 'Medium' },
      { id: 'v-l', value: 'Large' },
    ],
  },
  {
    id: 'opt-color',
    name: 'Color',
    values: [
      { id: 'v-navy', value: 'Navy' },
      { id: 'v-ivory', value: 'Ivory' },
    ],
  },
];

const VARIANTS: readonly ProductVariantLike[] = [
  {
    id: 'var-cheapest-sold-out',
    price: 10,
    stockQuantity: 0,
    optionValues: { size: 'small', color: 'navy' },
  },
  {
    id: 'var-m-ivory',
    price: 25,
    stockQuantity: 4,
    optionValues: { Size: 'Medium', Color: 'Ivory' },
  },
  {
    id: 'var-m-navy',
    price: 18,
    stockQuantity: 3,
    optionValues: { SIZE: 'medium', COLOR: 'navy' },
  },
  {
    id: 'var-l-navy',
    price: 30,
    stockQuantity: 0,
    optionValues: { Size: 'Large', Color: 'Navy' },
  },
  // Note: Large + Ivory does NOT exist (unavailable).
];

describe('variant-selection model', () => {
  it('picks the cheapest in-stock variant initially, or cheapest overall when all are sold out', () => {
    expect(findInitialVariant(VARIANTS)?.id).toBe('var-m-navy');

    const allSoldOut = VARIANTS.map((v) => ({ ...v, stockQuantity: 0 }));
    expect(findInitialVariant(allSoldOut)?.id).toBe('var-cheapest-sold-out');
  });

  it('matches option names and values case-insensitively', () => {
    const initial = buildInitialSelection(OPTIONS, VARIANTS);
    expect(initial).toEqual({ Size: 'Medium', Color: 'Navy' });

    const resolved = resolveSelectedVariant(OPTIONS, VARIANTS, {
      Size: 'medium',
      Color: 'IVORY',
    });
    expect(resolved?.id).toBe('var-m-ivory');
  });

  it('distinguishes unavailable combinations from sold-out combinations', () => {
    const availability = computeOptionAvailability(OPTIONS, VARIANTS, {
      Size: 'Large',
      Color: 'Navy',
    });

    // Under Size=Large: Navy exists (sold out), Ivory does not exist (unavailable).
    expect(availability['Color']).toEqual([
      { value: 'Navy', label: 'Navy', available: true, inStock: false },
      { value: 'Ivory', label: 'Ivory', available: false, inStock: false },
    ]);

    // Under Color=Navy: Small is sold out, Medium is in stock, Large is sold out.
    expect(availability['Size']).toEqual([
      { value: 'Small', label: 'Small', available: true, inStock: false },
      { value: 'Medium', label: 'Medium', available: true, inStock: true },
      { value: 'Large', label: 'Large', available: true, inStock: false },
    ]);
  });

  it('resolves single variant directly when a product has no options and sorts images by sortOrder', () => {
    const singleVariant: readonly ProductVariantLike[] = [
      { id: 'only', price: 42, stockQuantity: 5, optionValues: {} },
    ];
    expect(buildInitialSelection([], singleVariant)).toEqual({});
    expect(resolveSelectedVariant([], singleVariant, {})?.id).toBe('only');

    const sorted = getSortedImages([
      { url: 'https://cdn.example.com/2.jpg', sortOrder: 2 },
      { url: 'https://cdn.example.com/0.jpg', sortOrder: 0 },
      { url: 'https://cdn.example.com/1.jpg', sortOrder: 1 },
    ]);
    expect(sorted.map((img) => img.sortOrder)).toEqual([0, 1, 2]);
  });
});
