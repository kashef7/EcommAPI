namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IRemoveCartItemUseCase
{
    Task ExecuteAsync(Guid userId, Guid variantId);
}
