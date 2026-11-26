export function normalizeTagName(raw: string): string {
  return raw.trim().toLowerCase();
}

export function formatProductHeadingVariant(
  productName: string,
  variantLabel?: string | null,
): string {
  const trimmedLabel = variantLabel?.trim();
  if (!trimmedLabel) {
    return productName;
  }
  return `${productName} (${trimmedLabel})`;
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}
