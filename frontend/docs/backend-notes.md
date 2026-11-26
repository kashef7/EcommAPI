# Backend Notes and Discrepancies

Source of truth verified against:
- `Ecomm.API/Program.cs`
- `Ecomm.API/Controllers/*`
- `Ecomm.API/Middleware/GlobalExceptionHandler.cs`
- `Ecomm.API/Properties/launchSettings.json`
- `Ecomm.API/Extensions/ClaimsPrincipalExtensions.cs`
- `Ecomm.Application/Common/PagedResult.cs`
- `Ecomm.Application/DTOs/*`
- `Ecomm.Application/UseCases/Implementation/*`
- `Ecomm.Domain/Entities/*`
- `Ecomm.Infrastructure/Services/Implementation/TokenService.cs`
- `Ecomm.Infrastructure/Repositories/Implementation/*`
- `Ecomm.Infrastructure/Filters/Products/ProductFilter.cs`
- `Ecomm.Infrastructure/Persistence/Configurations/*`

## Discrepancies Found vs. Specification Section 3

1. **Default sort order on `GET /api/products` (`ProductQueryParamsDTO` / `ProductRepo.GetAllAsync`)**
   - Spec note: "`orderBy` (`price`, otherwise newest-first by created date), `orderDesc` (bool)".
   - Actual backend behavior: `ProductQueryParamsDTO.OrderDesc` defaults to `false`. In `ProductRepo.GetAllAsync`, when `orderBy` is not `"price"`, `OrderDesc == true` sorts by `CreatedAt DESC, Id ASC` and `OrderDesc == false` sorts by `CreatedAt ASC, Id ASC` (oldest first).
   - Frontend adaptation: For the default "Newest" sort option, explicitly pass `orderDesc=true` (and omit `orderBy`) in `GET /api/products` requests.

2. **Additional field validation limits in domain and persistence configurations**
   - Tag names (`Tag.cs`, `TagConfiguration.cs`): trimmed, lowercased, and restricted to 1-50 characters (`DomainException` if outside range).
   - Product image URLs (`ProductImageConfiguration.cs`): max length 2048 characters; empty/whitespace rejected by `ProductImage`.
   - Category names (`CategoryConfiguration.cs`): unique index on `Categories.Name`. Duplicate category create/rename throws Postgres `UniqueViolation` (`23505`), mapped by `GlobalExceptionHandler` to HTTP `409` with title `"Conflict"` and detail `"The request conflicted with another request. Please try again."`.

3. **User email update endpoint methods and DTO fields (`UsersController.cs`, `UpdateUserEmailDTO.cs`)**
   - Both `PATCH` and `PUT` are accepted for `/api/users/updateEmail` and `/api/users/updatePassword`.
   - `UpdateUserEmailDTO` defines `[Required]` on `Email` and also aliases `NewEmail` to the same backing field; sending `{ email }` matches validation cleanly.
   - `UpdateUserEmailUseCase` checks `GetUserByEmailAsync` without excluding the current user, so submitting the user's existing email returns `409` `"Email Already Exists"`.

4. **Admin option/value endpoints response payloads (`ProductsController.cs`)**
   - `POST /api/products/{id}/variants`, `POST /api/products/{id}/options`, `PATCH /api/products/{id}/options/{optionId}`, `POST /api/products/{id}/options/{optionId}/values`, and `PATCH /api/products/{id}/options/{optionId}/values/{valueId}` all return HTTP `200` with `GetProductDetailDTO`.
   - Per specification robustness guidance, the frontend still refetches `GET /api/products/{id}` after every admin mutation.

5. **Product catalog `minPrice` and price filtering (`ProductRepo.cs`, `ProductFilter.cs`)**
   - Confirmed: `minPrice` on `GET /api/products` is the minimum price among variants with `StockQuantity > 0`, falling back to minimum overall price if all variants have zero stock. Price range filtering (`minPrice`/`maxPrice`) follows the exact same stock-aware rule.

6. **Cart validation (`ValidateCartUseCase.cs`)**
   - Confirmed: When cart is empty or missing, returns `{ isValid: true, items: [], issues: [] }`.
   - `Unavailable` items are removed from the cart and persisted immediately.
   - `PriceChanged` updates `UnitPriceAtAdd` on the cart item and persists immediately, so subsequent calls will not report the same price change again.
   - Note: Backend `Messages` for `Unavailable` / stock / price items format `({variantLabel})` unconditionally even when `variantLabel` is empty; the frontend formats structured UI text directly from `productName`, `variantLabel`, `oldPrice`, `newPrice`, and `availableQuantity` so empty parentheses are not shown.

## Confirmed Backend Quirks (Designed Around)

1. **No CORS configured**: `Program.cs` has no CORS middleware. Local development uses Vite's `/api` proxy (`API_PROXY_TARGET`), and production requires same-origin hosting behind a reverse proxy or host rewrite.
2. **Cookie attributes (`AuthController.cs`)**: The `refreshToken` cookie is set with `HttpOnly = true`, `Secure = false`, `SameSite = SameSiteMode.Strict`. HTTPS production deployments must address `Secure = true`.
3. **HTTPS redirection & local launch profile**: `Program.cs` calls `app.UseHttpsRedirection()`. Running the API locally via the `http` launch profile (`http://localhost:5126`, see `Ecomm.API/Properties/launchSettings.json`) avoids redirect issues with the local Vite proxy.
4. **Refresh token in response body**: `AuthController` returns `refreshToken` and `refreshTokenExpiresAt` in JSON bodies on `signup`, `login`, and `refreshToken`. The frontend API layer strips both fields immediately upon parsing.
5. **JWT role claim format (`TokenService.cs`)**: `TokenService` writes `ClaimTypes.Role` (`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`) with `"Admin"` when `IsAdmin == true`. Token expiry is 15 minutes (`appsettings.json`: `ExpireMinutes = 15`), refresh token expiry is 7 days.
6. **Logout requires valid bearer token**: `POST /api/auth/logout` is `[Authorize]`. The frontend refreshes an expiring access token before calling logout and always clears client session state regardless of server response.
7. **Cart validate mutates state**: `POST /api/cart/validate` removes unavailable items and updates stored price snapshots, so the frontend always refetches `GET /api/cart` afterwards while preserving validation issues in page state.
