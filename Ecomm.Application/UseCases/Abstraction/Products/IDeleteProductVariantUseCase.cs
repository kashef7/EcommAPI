namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IDeleteProductVariantUseCase
{
    Task ExecuteAsync(Guid productId, Guid variantId);
}
