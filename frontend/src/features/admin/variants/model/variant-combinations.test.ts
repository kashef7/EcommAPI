import { describe, expect, it } from 'vitest';
import {
  areVariantDraftsSyncedWithOptions,
  buildCartesianCombinations,
  countCartesianCombinations,
  exceedsCombinationGuard,
  formatVariantCombinationLabel,
  generateVariantDrafts,
  hasVariantWithCombination,
  MAX_UNCONFIRMED_VARIANTS,
} from './variant-combinations';

describe('variant-combinations model', () => {
  it('generates cartesian product combinations in option order', () => {
    const combinations = buildCartesianCombinations([
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Color', values: ['Black', 'Ivory'] },
    ]);

    expect(combinations.map((c) => c.label)).toEqual([
      'Size: S, Color: Black',
      'Size: S, Color: Ivory',
      'Size: M, Color: Black',
      'Size: M, Color: Ivory',
    ]);
    expect(combinations[1]?.optionValues).toEqual({ Size: 'S', Color: 'Ivory' });
  });

  it('preserves entered prices and stock when regenerating after adding option values', () => {
    const initial = generateVariantDrafts(
      [
        { name: 'Size', values: ['S', 'M'] },
        { name: 'Color', values: ['Black'] },
      ],
      [],
    );

    const edited = initial.map((row) =>
      row.label === 'Size: M, Color: Black'
        ? { ...row, price: '28.50', stockQuantity: '14' }
        : { ...row, price: '24.00', stockQuantity: '6' },
    );

    const regenerated = generateVariantDrafts(
      [
        { name: 'Size', values: ['S', 'M', 'L'] },
        { name: 'Color', values: ['Black', 'Cream'] },
      ],
      edited,
    );

    expect(regenerated).toHaveLength(6);
    const preservedMBlack = regenerated.find((r) => r.label === 'Size: M, Color: Black');
    expect(preservedMBlack?.price).toBe('28.50');
    expect(preservedMBlack?.stockQuantity).toBe('14');

    const newLBlack = regenerated.find((r) => r.label === 'Size: L, Color: Black');
    expect(newLBlack?.price).toBe('');
    expect(newLBlack?.stockQuantity).toBe('0');
  });

  it('guards combination generation when count exceeds 50', () => {
    const exactly50 = countCartesianCombinations([
      { name: 'A', values: Array.from({ length: 10 }, (_, i) => `A${i}`) },
      { name: 'B', values: Array.from({ length: 5 }, (_, i) => `B${i}`) },
    ]);
    expect(exactly50).toBe(MAX_UNCONFIRMED_VARIANTS);
    expect(exceedsCombinationGuard(exactly50)).toBe(false);

    const over50 = countCartesianCombinations([
      { name: 'A', values: Array.from({ length: 9 }, (_, i) => `A${i}`) },
      { name: 'B', values: Array.from({ length: 6 }, (_, i) => `B${i}`) },
    ]);
    expect(over50).toBe(54);
    expect(exceedsCombinationGuard(over50)).toBe(true);
  });

  it('detects existing combinations case-insensitively and checks option sync', () => {
    expect(formatVariantCombinationLabel([], {})).toBe('Single version');

    const existing = [
      { optionValues: { Size: 'Medium', Color: 'Black' } },
      { optionValues: { Size: 'Large', Color: 'Ivory' } },
    ];
    expect(hasVariantWithCombination(existing, { size: 'medium', color: 'BLACK' })).toBe(true);
    expect(hasVariantWithCombination(existing, { Size: 'Medium', Color: 'Ivory' })).toBe(false);

    const synced = generateVariantDrafts([{ name: 'Size', values: ['S', 'M'] }], []);
    expect(areVariantDraftsSyncedWithOptions([{ name: 'Size', values: ['S', 'M'] }], synced)).toBe(
      true,
    );
    expect(
      areVariantDraftsSyncedWithOptions(
        [
          { name: 'Size', values: ['S', 'M'] },
          { name: 'Color', values: ['Navy'] },
        ],
        synced,
      ),
    ).toBe(false);
  });
});
