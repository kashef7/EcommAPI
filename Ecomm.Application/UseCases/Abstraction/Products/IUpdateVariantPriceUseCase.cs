using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IUpdateVariantPriceUseCase
{
    Task ExecuteAsync(Guid productId, Guid variantId, UpdateVariantPriceDTO dto);
}
