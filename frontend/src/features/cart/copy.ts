export const CART_COPY = {
  eyebrow: 'Shopping bag',
  title: 'Your cart',
  loadingLabel: 'Loading your cart',
  refreshingLabel: 'Updating cart',
  itemCountSingular: '1 item',
  itemCountPlural: (count: number) => `${count} items`,
  row: {
    unitPriceEach: (formatted: string) => `${formatted} each`,
    quantityLabel: (name: string) => `Quantity for ${name}`,
    removeLabel: (name: string) => `Remove ${name} from cart`,
    noImageFallback: 'No image',
    outOfStockWarning: 'Out of stock',
    removeAction: 'Remove',
    insufficientStockWarning: (available: number) => `Only ${available} available`,
    setQuantityAction: (available: number) => `Set quantity to ${available}`,
    priceChangedNote: (oldPrice: string, newPrice: string) =>
      `Price changed from ${oldPrice} to ${newPrice}`,
  },
  summary: {
    heading: 'Summary',
    itemsLabel: 'Items',
    totalLabel: 'Total',
    reviewButton: 'Review cart',
    reviewingButton: 'Reviewing cart...',
    clearButton: 'Clear cart',
  },
  clearDialog: {
    title: 'Clear your cart',
    message: 'All items will be removed from your cart. This action cannot be undone.',
    confirmLabel: 'Clear cart',
    cancelLabel: 'Cancel',
  },
  review: {
    upToDate: 'Your cart is up to date.',
    issuesTitle: 'Cart review',
    dismissLabel: 'Dismiss review notice',
    unavailableItem: (name: string, label: string) =>
      label.trim().length > 0
        ? `${name} (${label.trim()}) is no longer available and was removed.`
        : `${name} is no longer available and was removed.`,
  },
  empty: {
    heading: 'Your cart is empty',
    message: 'Browse the collection to add items to your cart.',
    actionLabel: 'Continue shopping',
  },
  error: {
    title: 'Unable to load your cart',
  },
  toasts: {
    removed: 'Item removed from cart',
    cleared: 'Cart cleared',
  },
} as const;
