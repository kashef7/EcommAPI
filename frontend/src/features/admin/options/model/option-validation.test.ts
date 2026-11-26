import { describe, expect, it } from 'vitest';
import { tryAddOptionValue, validateAddOptionDialog } from './option-validation';

describe('option-validation model', () => {
  it('prevents duplicate option values case-insensitively', () => {
    expect(tryAddOptionValue(['Medium'], '  medium  ')).toEqual({
      ok: false,
      values: ['Medium'],
      error: 'Value "medium" is already added.',
    });
    expect(tryAddOptionValue(['Medium'], 'Large')).toEqual({
      ok: true,
      values: ['Medium', 'Large'],
    });
  });

  it('requires existingVariantsValue from entered values when product has variants', () => {
    const missingErrs = validateAddOptionDialog(
      { name: 'Finish', values: ['Matte', 'Gloss'], existingVariantsValue: '' },
      ['Size'],
      true,
    );
    expect(missingErrs.existingVariantsValue).toBe('Choose a value for existing variants.');

    const duplicateOptionErrs = validateAddOptionDialog(
      { name: 'size', values: ['Small'], existingVariantsValue: 'Small' },
      ['Size'],
      true,
    );
    expect(duplicateOptionErrs.name).toBe('Option "size" already exists.');

    const validErrs = validateAddOptionDialog(
      { name: 'Finish', values: ['Matte', 'Gloss'], existingVariantsValue: 'Matte' },
      ['Size'],
      true,
    );
    expect(validErrs).toEqual({});
  });
});
