using Ecomm.Application.DTOs.Categories;

namespace Ecomm.Application.UseCases.Abstraction.Categories;

public interface ICreateCategoryUseCase
{
    Task<CategoryDTO> ExecuteAsync(CreateCategoryDTO dto);
}
