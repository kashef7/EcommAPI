using Ecomm.Application.DTOs.Carts;
using Ecomm.Domain.Entities.Carts;

namespace Ecomm.Application.Repositories.Abstraction;

public interface ICartRepo
{
    Task<Cart> GetOrCreateCartAsync(Guid userId);
    Task<GetCartItemsDTO> GetCartDisplayAsync(Guid userId);
    Task RemoveProductFromAllCartsAsync(Guid productId);
    Task RemoveVariantFromAllCartsAsync(Guid variantId);
    Task SaveChangesAsync();
}
