using Ecomm.Application.DTOs.Carts;

namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IValidateCartUseCase
{
    Task<CartValidationResultDTO> ExecuteAsync(Guid userId);
}
