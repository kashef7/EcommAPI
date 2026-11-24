using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IAddProductOptionValueUseCase
{
    Task<GetProductDetailDTO> ExecuteAsync(Guid productId, Guid optionId, AddProductOptionValueDTO dto);
}
