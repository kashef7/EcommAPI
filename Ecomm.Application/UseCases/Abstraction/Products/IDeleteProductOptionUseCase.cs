namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IDeleteProductOptionUseCase
{
    Task ExecuteAsync(Guid productId, Guid optionId);
}
