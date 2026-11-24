using Ecomm.Application.DTOs.Categories;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Categories;
using Ecomm.Domain.Entities.Categories;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Categories;

public class CreateCategoryUseCase : ICreateCategoryUseCase
{
    private readonly ICategoryRepo _categoryRepo;
    private readonly ILogger<CreateCategoryUseCase> _logger;

    public CreateCategoryUseCase(ICategoryRepo categoryRepo, ILogger<CreateCategoryUseCase> logger)
    {
        _categoryRepo = categoryRepo;
        _logger = logger;
    }

    public async Task<CategoryDTO> ExecuteAsync(CreateCategoryDTO dto)
    {
        var category = new Category(dto.Name);
        await _categoryRepo.AddAsync(category);
        await _categoryRepo.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} ({CategoryName}) created", category.Id, category.Name);
        return new CategoryDTO(category.Id, category.Name, category.CreatedAt, category.UpdatedAt);
    }
}
