using Ecomm.Application.DTOs.ProductDTO;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IAddProductUseCase
{
    public Task<GetProductDTO> ExecuteAsync(AddProductDTO product);
}