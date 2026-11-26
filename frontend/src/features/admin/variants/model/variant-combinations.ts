export interface AdminVariantOptionModel {
  readonly id: string;
  readonly name: string;
  readonly values: readonly { readonly id: string; readonly value: string }[];
}

export interface AdminVariantModel {
  readonly id: string;
  readonly price: number;
  readonly stockQuantity: number;
  readonly optionValues: Readonly<Record<string, string>>;
}

export interface AddVariantSubmitPayload {
  readonly optionValues?: Readonly<Record<string, string>>;
  readonly price: number;
  readonly stockQuantity: number;
}

export type AddVariantDialogFieldKey = 'price' | 'stockQuantity';

export type AddVariantDialogResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly fieldErrors?: Partial<Record<AddVariantDialogFieldKey, string>>;
      readonly formErrors?: readonly string[];
    };

export const MAX_UNCONFIRMED_VARIANTS = 50;

export interface CombinationOptionInput {
  readonly name: string;
  readonly values: readonly string[];
}

export interface GeneratedCombination {
  readonly key: string;
  readonly label: string;
  readonly optionValues: Readonly<Record<string, string>>;
}

export interface VariantDraftRow {
  readonly key: string;
  readonly label: string;
  readonly optionValues: Readonly<Record<string, string>>;
  readonly price: string;
  readonly stockQuantity: string;
}

export function buildCombinationKey(optionValues: Readonly<Record<string, string>>): string {
  const entries = Object.entries(optionValues)
    .map(([optName, val]) => [optName.trim().toLowerCase(), val.trim().toLowerCase()] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

export function formatVariantCombinationLabel(
  options: readonly { readonly name: string }[],
  optionValues: Readonly<Record<string, string>>,
): string {
  if (options.length === 0) {
    return 'Single version';
  }

  const normalizedMap = new Map<string, string>();
  for (const [k, v] of Object.entries(optionValues)) {
    normalizedMap.set(k.trim().toLowerCase(), v);
  }

  const parts: string[] = [];
  for (const option of options) {
    const matchedValue = normalizedMap.get(option.name.trim().toLowerCase());
    if (matchedValue) {
      parts.push(`${option.name.trim()}: ${matchedValue}`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : 'Single version';
}

export function countCartesianCombinations(options: readonly CombinationOptionInput[]): number {
  if (options.length === 0) {
    return 0;
  }
  let total = 1;
  for (const option of options) {
    const validValuesCount = option.values.filter((v) => v.trim().length > 0).length;
    if (validValuesCount === 0) {
      return 0;
    }
    total *= validValuesCount;
  }
  return total;
}

export function exceedsCombinationGuard(count: number): boolean {
  return count > MAX_UNCONFIRMED_VARIANTS;
}

export function buildCartesianCombinations(
  options: readonly CombinationOptionInput[],
): readonly GeneratedCombination[] {
  const normalizedOptions = options
    .map((opt) => ({
      name: opt.name.trim(),
      values: opt.values.map((v) => v.trim()).filter((v) => v.length > 0),
    }))
    .filter((opt) => opt.name.length > 0 && opt.values.length > 0);

  if (normalizedOptions.length !== options.length || normalizedOptions.length === 0) {
    return [];
  }

  let acc: Record<string, string>[] = [{}];
  for (const option of normalizedOptions) {
    const nextAcc: Record<string, string>[] = [];
    for (const partial of acc) {
      for (const value of option.values) {
        nextAcc.push({ ...partial, [option.name]: value });
      }
    }
    acc = nextAcc;
  }

  return acc.map((optionValues) => ({
    key: buildCombinationKey(optionValues),
    label: formatVariantCombinationLabel(normalizedOptions, optionValues),
    optionValues,
  }));
}

export function generateVariantDrafts(
  options: readonly CombinationOptionInput[],
  existingDrafts: readonly VariantDraftRow[],
): readonly VariantDraftRow[] {
  const existingByKey = new Map<string, VariantDraftRow>();
  for (const draft of existingDrafts) {
    existingByKey.set(buildCombinationKey(draft.optionValues), draft);
  }

  const combinations = buildCartesianCombinations(options);
  return combinations.map((combo) => {
    const preserved = existingByKey.get(combo.key);
    return {
      key: combo.key,
      label: combo.label,
      optionValues: combo.optionValues,
      price: preserved ? preserved.price : '',
      stockQuantity: preserved ? preserved.stockQuantity : '0',
    };
  });
}

export function areVariantDraftsSyncedWithOptions(
  options: readonly CombinationOptionInput[],
  drafts: readonly VariantDraftRow[],
): boolean {
  if (options.length === 0) {
    return true;
  }
  if (drafts.length === 0) {
    return false;
  }

  const validKeys = new Set(buildCartesianCombinations(options).map((combo) => combo.key));
  const seenKeys = new Set<string>();
  for (const draft of drafts) {
    const key = buildCombinationKey(draft.optionValues);
    if (!validKeys.has(key) || seenKeys.has(key)) {
      return false;
    }
    seenKeys.add(key);
  }
  return true;
}

export function hasVariantWithCombination(
  existingVariants: readonly { readonly optionValues: Readonly<Record<string, string>> }[],
  candidateOptionValues: Readonly<Record<string, string>>,
): boolean {
  const targetKey = buildCombinationKey(candidateOptionValues);
  return existingVariants.some(
    (variant) => buildCombinationKey(variant.optionValues) === targetKey,
  );
}
