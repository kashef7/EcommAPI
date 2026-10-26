namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IDeleteProductUseCase
{
    Task ExecuteAsync(Guid id);
}
