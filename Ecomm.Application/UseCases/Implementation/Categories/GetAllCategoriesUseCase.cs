using Ecomm.Application.DTOs.Categories;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Categories;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Categories;

public class GetAllCategoriesUseCase : IGetAllCategoriesUseCase
{
    private readonly ICategoryRepo _categoryRepo;
    private readonly ILogger<GetAllCategoriesUseCase> _logger;

    public GetAllCategoriesUseCase(ICategoryRepo categoryRepo, ILogger<GetAllCategoriesUseCase> logger)
    {
        _categoryRepo = categoryRepo;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CategoryDTO>> ExecuteAsync()
    {
        var categories = await _categoryRepo.GetAllAsync();
        return categories
            .Select(c => new CategoryDTO(c.Id, c.Name, c.CreatedAt, c.UpdatedAt))
            .ToList();
    }
}
