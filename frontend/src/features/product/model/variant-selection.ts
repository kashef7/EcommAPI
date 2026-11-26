export interface ProductImageLike {
  readonly url: string;
  readonly sortOrder: number;
}

export interface ProductOptionValueLike {
  readonly id: string;
  readonly value: string;
}

export interface ProductOptionLike {
  readonly id: string;
  readonly name: string;
  readonly values: readonly ProductOptionValueLike[];
}

export interface ProductVariantLike {
  readonly id: string;
  readonly price: number;
  readonly stockQuantity: number;
  readonly optionValues: Readonly<Record<string, string>>;
}

export interface ComputedOptionChoice {
  readonly value: string;
  readonly label: string;
  readonly available: boolean;
  readonly inStock: boolean;
}

export type OptionSelectionMap = Readonly<Record<string, string>>;

export function normalizeOptionToken(value: string): string {
  return value.trim().toLowerCase();
}

export function getSortedImages<T extends ProductImageLike>(images: readonly T[]): readonly T[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getVariantOptionValue(
  variant: ProductVariantLike,
  optionName: string,
): string | undefined {
  const target = normalizeOptionToken(optionName);
  for (const [key, val] of Object.entries(variant.optionValues)) {
    if (normalizeOptionToken(key) === target) {
      return val;
    }
  }
  return undefined;
}

function variantMatchesOptionValue(
  variant: ProductVariantLike,
  optionName: string,
  expectedValue: string,
): boolean {
  const actual = getVariantOptionValue(variant, optionName);
  if (actual === undefined) {
    return false;
  }
  return normalizeOptionToken(actual) === normalizeOptionToken(expectedValue);
}

export function findInitialVariant<T extends ProductVariantLike>(variants: readonly T[]): T | null {
  if (variants.length === 0) {
    return null;
  }

  const inStock = variants.filter((variant) => variant.stockQuantity > 0);
  const candidates = inStock.length > 0 ? inStock : variants;

  let best = candidates[0];
  if (!best) {
    return null;
  }

  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    if (candidate && candidate.price < best.price) {
      best = candidate;
    }
  }
  return best;
}

export function buildInitialSelection(
  options: readonly ProductOptionLike[],
  variants: readonly ProductVariantLike[],
): OptionSelectionMap {
  if (options.length === 0) {
    return {};
  }

  const initialVariant = findInitialVariant(variants);
  const selection: Record<string, string> = {};

  for (const option of options) {
    const variantValue = initialVariant
      ? getVariantOptionValue(initialVariant, option.name)
      : undefined;

    if (variantValue !== undefined) {
      const normalizedVariantVal = normalizeOptionToken(variantValue);
      const canonical = option.values.find(
        (val) => normalizeOptionToken(val.value) === normalizedVariantVal,
      );
      selection[option.name] = canonical ? canonical.value : variantValue;
    } else if (option.values[0]) {
      selection[option.name] = option.values[0].value;
    }
  }

  return selection;
}

export function resolveSelectedVariant<T extends ProductVariantLike>(
  options: readonly ProductOptionLike[],
  variants: readonly T[],
  selection: OptionSelectionMap,
): T | null {
  if (variants.length === 0) {
    return null;
  }

  if (options.length === 0) {
    return variants[0] ?? null;
  }

  for (const option of options) {
    if (!selection[option.name]) {
      return null;
    }
  }

  return (
    variants.find((variant) =>
      options.every((option) => {
        const chosen = selection[option.name];
        return chosen !== undefined && variantMatchesOptionValue(variant, option.name, chosen);
      }),
    ) ?? null
  );
}

export function computeOptionAvailability(
  options: readonly ProductOptionLike[],
  variants: readonly ProductVariantLike[],
  selection: OptionSelectionMap,
): Readonly<Record<string, readonly ComputedOptionChoice[]>> {
  const result: Record<string, readonly ComputedOptionChoice[]> = {};

  for (const option of options) {
    const otherOptions = options.filter((other) => other.name !== option.name);

    result[option.name] = option.values.map((optVal) => {
      const matchingVariants = variants.filter((variant) => {
        if (!variantMatchesOptionValue(variant, option.name, optVal.value)) {
          return false;
        }
        return otherOptions.every((other) => {
          const chosen = selection[other.name];
          if (chosen === undefined) {
            return true;
          }
          return variantMatchesOptionValue(variant, other.name, chosen);
        });
      });

      return {
        value: optVal.value,
        label: optVal.value,
        available: matchingVariants.length > 0,
        inStock: matchingVariants.some((variant) => variant.stockQuantity > 0),
      };
    });
  }

  return result;
}
