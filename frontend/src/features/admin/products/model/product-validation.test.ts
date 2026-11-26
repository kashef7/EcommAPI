import { describe, expect, it } from 'vitest';
import {
  buildProductPatch,
  mapCreateProductFieldErrors,
  moveListItem,
  type ProductBasicsValues,
  tryAddTag,
} from './product-validation';

const BASELINE: ProductBasicsValues = {
  name: 'Linen Notebook',
  description: 'Thread-sewn notebook.',
  categoryId: '11111111-2222-3333-4444-555555555555',
  tags: ['linen', 'paper'],
  imageUrls: ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'],
};

describe('product-validation model', () => {
  it('builds a PATCH payload containing only changed fields', () => {
    expect(buildProductPatch(BASELINE, { ...BASELINE })).toEqual({
      hasChanges: false,
      payload: {},
    });

    const diff = buildProductPatch(BASELINE, {
      ...BASELINE,
      name: '  Linen Notebook A5  ',
      tags: [],
    });
    expect(diff.hasChanges).toBe(true);
    expect(diff.payload).toEqual({
      name: 'Linen Notebook A5',
      tags: [],
    });

    const reorderedImages = buildProductPatch(BASELINE, {
      ...BASELINE,
      imageUrls: moveListItem(BASELINE.imageUrls, 0, 1),
    });
    expect(reorderedImages.hasChanges).toBe(true);
    expect(reorderedImages.payload).toEqual({
      imageUrls: ['https://cdn.example.com/2.jpg', 'https://cdn.example.com/1.jpg'],
    });
  });

  it('normalizes tags to lowercase, deduplicates, and enforces max 20', () => {
    const added = tryAddTag(['linen'], '  Brass  ');
    expect(added).toEqual({ ok: true, tags: ['linen', 'brass'] });

    const duplicate = tryAddTag(['linen', 'brass'], 'LINEN');
    expect(duplicate.ok).toBe(false);
    expect(duplicate.error).toBe('That tag is already added.');

    const twenty = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
    const overflow = tryAddTag(twenty, 'extra');
    expect(overflow.ok).toBe(false);
    expect(overflow.error).toContain('20');
  });

  it('maps indexed server ValidationProblemDetails paths to exact inputs and summary', () => {
    const mapped = mapCreateProductFieldErrors(
      {
        Name: ['Product name is required.'],
        'ImageUrls[1]': ['Invalid image URL.'],
        'Options[0].Name': ['Option name too long.'],
        'Variants[0].Price': ['Price must be between 0.01 and 1000000.'],
        'Variants[1].StockQuantity': ['Stock cannot be negative.'],
        'Variants[99].Price': ['Out of bounds variant issue.'],
        GeneralRule: ['Product combination conflict.'],
      },
      1,
      2,
    );

    expect(mapped.basicsErrors.name).toBe('Product name is required.');
    expect(mapped.imageErrors[1]).toBe('Invalid image URL.');
    expect(mapped.optionErrors[0]?.name).toBe('Option name too long.');
    expect(mapped.variantErrors[0]?.price).toBe('Price must be between 0.01 and 1000000.');
    expect(mapped.variantErrors[1]?.stockQuantity).toBe('Stock cannot be negative.');
    expect(mapped.summary).toEqual([
      'Out of bounds variant issue.',
      'Product combination conflict.',
    ]);
  });
});
