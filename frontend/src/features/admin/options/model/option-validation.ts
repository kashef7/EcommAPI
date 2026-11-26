import { LIMITS, validateRequiredText } from '@/core/validation/validators';

export interface AdminOptionValueModel {
  readonly id: string;
  readonly value: string;
}

export interface AdminOptionModel {
  readonly id: string;
  readonly name: string;
  readonly values: readonly AdminOptionValueModel[];
}

export interface AddOptionSubmitPayload {
  readonly name: string;
  readonly values: readonly string[];
  readonly existingVariantsValue?: string;
}

export type AddOptionDialogResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly fieldErrors?: Partial<Record<AddOptionDialogFieldKey, string>>;
      readonly formErrors?: readonly string[];
    };

export interface OptionDraft {
  readonly localId: string;
  readonly name: string;
  readonly values: readonly string[];
}

export interface OptionDraftError {
  readonly name?: string;
  readonly values?: string;
}

export function validateOptionNameInput(
  name: string,
  existingNamesLower: readonly string[],
): string | undefined {
  const baseError = validateRequiredText(name, 'Option name', LIMITS.optionNameMax);
  if (baseError) {
    return baseError;
  }
  const normalized = name.trim().toLowerCase();
  if (existingNamesLower.includes(normalized)) {
    return `Option "${name.trim()}" already exists.`;
  }
  return undefined;
}

export function validateOptionValueInput(
  value: string,
  existingValues: readonly string[],
): string | undefined {
  const baseError = validateRequiredText(value, 'Option value', LIMITS.optionValueMax);
  if (baseError) {
    return baseError;
  }
  const normalized = value.trim().toLowerCase();
  if (existingValues.some((existing) => existing.trim().toLowerCase() === normalized)) {
    return `Value "${value.trim()}" is already added.`;
  }
  return undefined;
}

export interface AddOptionValueResult {
  readonly ok: boolean;
  readonly values: readonly string[];
  readonly error?: string;
}

export function tryAddOptionValue(
  existingValues: readonly string[],
  rawInput: string,
): AddOptionValueResult {
  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    return { ok: false, values: existingValues };
  }
  const err = validateOptionValueInput(trimmed, existingValues);
  if (err) {
    return { ok: false, values: existingValues, error: err };
  }
  return { ok: true, values: [...existingValues, trimmed] };
}

export function validateCreateOptionsList(
  options: readonly OptionDraft[],
): Readonly<Record<number, OptionDraftError>> {
  const errors: Record<number, OptionDraftError> = {};
  const seenNames = new Set<string>();

  options.forEach((option, index) => {
    const rowErr: { name?: string; values?: string } = {};
    const nameRequired = validateRequiredText(option.name, 'Option name', LIMITS.optionNameMax);
    if (nameRequired) {
      rowErr.name = nameRequired;
    } else {
      const normalizedName = option.name.trim().toLowerCase();
      if (seenNames.has(normalizedName)) {
        rowErr.name = `Duplicate option name "${option.name.trim()}".`;
      } else {
        seenNames.add(normalizedName);
      }
    }

    if (option.values.length === 0) {
      rowErr.values = 'Add at least one value for this option.';
    }

    if (rowErr.name || rowErr.values) {
      errors[index] = rowErr;
    }
  });

  return errors;
}

export interface AddOptionDialogValues {
  readonly name: string;
  readonly values: readonly string[];
  readonly existingVariantsValue: string;
}

export type AddOptionDialogFieldKey = 'name' | 'values' | 'existingVariantsValue';

export function validateAddOptionDialog(
  input: AddOptionDialogValues,
  existingOptionNames: readonly string[],
  requiresExistingVariantsValue: boolean,
): Partial<Record<AddOptionDialogFieldKey, string>> {
  const errors: Partial<Record<AddOptionDialogFieldKey, string>> = {};
  const existingLower = existingOptionNames.map((n) => n.trim().toLowerCase());

  const nameError = validateOptionNameInput(input.name, existingLower);
  if (nameError) {
    errors.name = nameError;
  }

  if (input.values.length === 0) {
    errors.values = 'Add at least one value.';
  }

  if (requiresExistingVariantsValue) {
    const selected = input.existingVariantsValue.trim();
    if (selected.length === 0) {
      errors.existingVariantsValue = 'Choose a value for existing variants.';
    } else if (!input.values.some((v) => v.trim().toLowerCase() === selected.toLowerCase())) {
      errors.existingVariantsValue = 'Selected value must be one of the values entered above.';
    }
  }

  return errors;
}
