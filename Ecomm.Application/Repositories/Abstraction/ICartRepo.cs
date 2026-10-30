using Ecomm.Domain.Entities.Carts;

namespace Ecomm.Application.Repositories.Abstraction;

public interface ICartRepo
{
    Task<Cart?> GetCartByUserIdAsync(Guid userId);
    
    Task SaveChangesAsync();
}