using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IAddProductUseCase
{
    Task<GetProductDTO> ExecuteAsync(AddProductDTO product);
}
