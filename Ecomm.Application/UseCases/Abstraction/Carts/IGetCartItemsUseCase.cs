using Ecomm.Application.DTOs.Carts;

namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IGetCartItemsUseCase
{
    Task<GetCartItemsDTO> ExecuteAsync(Guid userId);
}
