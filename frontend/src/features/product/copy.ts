export const PRODUCT_COPY = {
  shopBreadcrumb: 'Shop',
  loadingLabel: 'Loading product details',
  notFound: {
    heading: 'This product is no longer available',
    message: 'It may have been removed or the link may be incomplete.',
    actionLabel: 'Back to shop',
  },
  error: {
    title: 'Unable to load product',
  },
  gallery: {
    thumbnailLabel: (index: number, total: number) => `View image ${index} of ${total}`,
    noImageFallback: 'No image available',
  },
  stock: {
    inStock: 'In stock',
    lowStock: (count: number) => `Only ${count} left`,
    soldOut: 'Sold out',
    soldOutHint: 'This selection is currently sold out.',
    unavailableHint: 'This combination is currently unavailable.',
  },
  quantityLabel: 'Quantity',
  tagsLabel: 'Tags',
  addToCart: {
    idle: 'Add to cart',
    submitting: 'Adding to cart...',
    added: 'Added',
    addedToast: 'Added to your cart',
  },
} as const;
