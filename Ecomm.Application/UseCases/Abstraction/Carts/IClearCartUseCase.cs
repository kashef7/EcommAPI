namespace Ecomm.Application.UseCases.Abstraction.Carts;

public interface IClearCartUseCase
{
    public Task ExecuteAsync(Guid userId);
}