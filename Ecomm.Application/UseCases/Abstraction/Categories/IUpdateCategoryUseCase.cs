using Ecomm.Application.DTOs.Categories;

namespace Ecomm.Application.UseCases.Abstraction.Categories;

public interface IUpdateCategoryUseCase
{
    Task ExecuteAsync(Guid id, UpdateCategoryDTO dto);
}
