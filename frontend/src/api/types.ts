export interface AuthSessionPayload {
  readonly name: string;
  readonly email: string;
  readonly accessToken: string;
  readonly accessExpiresIn: number;
}

export interface SignUpRequest {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface UserProfile {
  readonly name: string;
  readonly email: string;
}

export interface UpdateEmailRequest {
  readonly email: string;
}

export interface UpdatePasswordRequest {
  readonly oldPassword: string;
  readonly newPassword: string;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TagItem {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
}

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export interface ProductSummary {
  readonly id: string;
  readonly name: string;
  readonly categoryName: string;
  readonly primaryImageUrl: string | null;
  readonly minPrice: number;
  readonly inStock: boolean;
  readonly tags: readonly string[];
}

export interface ProductQueryParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly name?: string;
  readonly categoryId?: string;
  readonly tags?: readonly string[];
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly inStock?: boolean;
  readonly orderBy?: string;
  readonly orderDesc?: boolean;
}

export interface ProductImageDetail {
  readonly url: string;
  readonly sortOrder: number;
}

export interface ProductOptionValueDetail {
  readonly id: string;
  readonly value: string;
}

export interface ProductOptionDetail {
  readonly id: string;
  readonly name: string;
  readonly values: readonly ProductOptionValueDetail[];
}

export interface ProductVariantDetail {
  readonly id: string;
  readonly price: number;
  readonly stockQuantity: number;
  readonly optionValues: Readonly<Record<string, string>>;
}

export interface ProductDetail {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: {
    readonly id: string;
    readonly name: string;
  };
  readonly tags: readonly string[];
  readonly images: readonly ProductImageDetail[];
  readonly options: readonly ProductOptionDetail[];
  readonly variants: readonly ProductVariantDetail[];
  readonly createdAt: string;
}

export interface CreateProductOptionInput {
  readonly name: string;
  readonly values: readonly string[];
}

export interface CreateProductVariantInput {
  readonly optionValues?: Readonly<Record<string, string>>;
  readonly price: number;
  readonly stockQuantity: number;
}

export interface CreateProductRequest {
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly tags?: readonly string[];
  readonly imageUrls?: readonly string[];
  readonly options?: readonly CreateProductOptionInput[];
  readonly variants: readonly CreateProductVariantInput[];
}

export interface UpdateProductRequest {
  readonly name?: string;
  readonly description?: string;
  readonly categoryId?: string;
  readonly tags?: readonly string[];
  readonly imageUrls?: readonly string[];
}

export interface ProductStockResponse {
  readonly id: string;
  readonly stock: number;
}

export interface AddVariantRequest {
  readonly optionValues?: Readonly<Record<string, string>>;
  readonly price: number;
  readonly stockQuantity: number;
}

export interface AddOptionRequest {
  readonly name: string;
  readonly values: readonly string[];
  readonly existingVariantsValue?: string;
}

export interface CartItem {
  readonly variantId: string;
  readonly productId: string;
  readonly productName: string;
  readonly variantLabel: string;
  readonly imageUrl: string | null;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly lineTotal: number;
}

export interface CartResponse {
  readonly cartItems: readonly CartItem[];
  readonly totalPrice: number;
}

export type CartIssueType = 'Unavailable' | 'OutOfStock' | 'InsufficientStock' | 'PriceChanged';

export interface CartValidationIssue {
  readonly variantId: string;
  readonly productName: string;
  readonly variantLabel: string;
  readonly issueTypes: readonly CartIssueType[];
  readonly messages: readonly string[];
  readonly oldPrice?: number | null;
  readonly newPrice?: number | null;
  readonly availableQuantity?: number | null;
}

export interface CartValidationResult {
  readonly isValid: boolean;
  readonly items: readonly CartValidationIssue[];
}
