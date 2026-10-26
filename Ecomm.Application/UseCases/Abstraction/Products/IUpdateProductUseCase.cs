using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IUpdateProductUseCase
{
    Task ExecuteAsync(Guid id, UpdateProductDTO productDto);
}
