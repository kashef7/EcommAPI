export const routes = {
  home(query?: URLSearchParams): string {
    const qs = query?.toString();
    return qs ? `/index.html?${qs}` : '/index.html';
  },
  product(id: string): string {
    return `/product.html?id=${encodeURIComponent(id)}`;
  },
  cart(): string {
    return '/cart.html';
  },
  login(next?: string): string {
    return next ? `/login.html?next=${encodeURIComponent(next)}` : '/login.html';
  },
  signup(next?: string): string {
    return next ? `/signup.html?next=${encodeURIComponent(next)}` : '/signup.html';
  },
  profile(): string {
    return '/profile.html';
  },
  adminProducts(): string {
    return '/admin/index.html';
  },
  adminProductEditor(id?: string): string {
    return id ? `/admin/product.html?id=${encodeURIComponent(id)}` : '/admin/product.html';
  },
  adminCategories(): string {
    return '/admin/categories.html';
  },
} as const;

export function getCurrentRelativeUrl(): string {
  if (typeof window === 'undefined') {
    return '/index.html';
  }
  return `${window.location.pathname}${window.location.search}`;
}
