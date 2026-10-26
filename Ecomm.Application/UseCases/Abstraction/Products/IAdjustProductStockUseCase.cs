using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IAdjustProductStockUseCase
{
    Task<ProductStockDTO> ExecuteAsync(Guid id, AdjustProductStockDTO dto);
}
