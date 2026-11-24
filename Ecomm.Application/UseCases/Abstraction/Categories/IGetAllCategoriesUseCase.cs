using Ecomm.Application.DTOs.Categories;

namespace Ecomm.Application.UseCases.Abstraction.Categories;

public interface IGetAllCategoriesUseCase
{
    Task<IReadOnlyList<CategoryDTO>> ExecuteAsync();
}
