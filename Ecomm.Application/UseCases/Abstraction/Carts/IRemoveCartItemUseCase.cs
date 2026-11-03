namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IRemoveCartItemUseCase
{
    public Task ExecuteAsync(Guid userId, Guid productId);
}