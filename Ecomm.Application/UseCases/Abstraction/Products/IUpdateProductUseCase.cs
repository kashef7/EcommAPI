using Ecomm.Application.DTOs.ProductDTO;
using Ecomm.Domain.Entities.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IUpdateProductUseCase
{
    Task ExecuteAsync(Guid id,UpdateProductDTO productDto);
}