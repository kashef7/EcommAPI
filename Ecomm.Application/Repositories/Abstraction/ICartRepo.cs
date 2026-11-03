using Ecomm.Domain.Entities.Carts;

namespace Ecomm.Application.Repositories.Abstraction;

public interface ICartRepo
{
    Task<Cart> GetOrCreateCartAsync(Guid userId);
    Task RemoveProductFromAllCartsAsync(Guid productId);
    Task SaveChangesAsync();
}
