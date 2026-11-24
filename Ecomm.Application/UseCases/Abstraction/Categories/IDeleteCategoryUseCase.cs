namespace Ecomm.Application.UseCases.Abstraction.Categories;

public interface IDeleteCategoryUseCase
{
    Task ExecuteAsync(Guid id);
}
