using Ecomm.Application.DTOs.Carts;

namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IUpdateCartItemUseCase
{
    Task ExecuteAsync(Guid userId, Guid variantId, UpdateCartItemQuantityDTO updateCartItemQuantityDto);
}
