using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IGetProductByIdUseCase
{
    Task<GetProductDTO> ExecuteAsync(Guid productId);
}
