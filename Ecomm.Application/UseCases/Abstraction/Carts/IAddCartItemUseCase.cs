using Ecomm.Application.DTOs.Carts;

namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IAddCartItemUseCase
{
    public Task ExecuteAsync(Guid userId, AddCartItemDTO  addCartItemDto);
}