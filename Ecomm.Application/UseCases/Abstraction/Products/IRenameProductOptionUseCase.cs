using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IRenameProductOptionUseCase
{
    Task<GetProductDetailDTO> ExecuteAsync(Guid productId, Guid optionId, RenameProductOptionDTO dto);
}
