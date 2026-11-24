using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IRenameProductOptionValueUseCase
{
    Task<GetProductDetailDTO> ExecuteAsync(Guid productId, Guid optionId, Guid valueId, RenameProductOptionValueDTO dto);
}
