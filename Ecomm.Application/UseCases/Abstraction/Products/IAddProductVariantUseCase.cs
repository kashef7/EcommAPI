using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IAddProductVariantUseCase
{
    Task<GetProductDetailDTO> ExecuteAsync(Guid productId, AddProductVariantDTO dto);
}
