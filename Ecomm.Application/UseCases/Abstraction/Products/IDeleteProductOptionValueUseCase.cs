namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IDeleteProductOptionValueUseCase
{
    Task ExecuteAsync(Guid productId, Guid optionId, Guid valueId);
}
