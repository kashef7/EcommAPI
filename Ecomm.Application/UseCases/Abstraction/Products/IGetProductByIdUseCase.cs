using Ecomm.Application.DTOs.ProductDTO;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IGetProductByIdUseCase
{
    Task<GetProductDTO> ExecuteAsync(Guid productId);
}
