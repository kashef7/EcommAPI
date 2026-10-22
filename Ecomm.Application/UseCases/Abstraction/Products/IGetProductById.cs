using Ecomm.Application.DTOs.ProductDTO;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IGetProductById
{
    Task<GetProductDTO> ExecuteAsync(Guid productId);
}