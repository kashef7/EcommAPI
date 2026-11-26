import { env } from '@/config/env';

const formatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}::${currency}`;
  const existing = formatterCache.get(key);
  if (existing) {
    return existing;
  }
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
  formatterCache.set(key, formatter);
  return formatter;
}

export function formatMoney(
  amount: number,
  locale: string = env.locale,
  currency: string = env.currencyCode,
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return getCurrencyFormatter(locale, currency).format(safeAmount);
}
