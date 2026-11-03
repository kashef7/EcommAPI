using Ecomm.Application.DTOs.Carts;

namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IUpdateCartItemUseCase
{
    public Task ExecuteAsync(Guid userId,Guid productId, UpdateCartItemQuantityDTO updateCartItemQuantityDto);
}