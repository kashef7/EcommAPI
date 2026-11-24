using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IAddProductOptionUseCase
{
    Task<GetProductDetailDTO> ExecuteAsync(Guid productId, AddProductOptionDTO dto);
}
