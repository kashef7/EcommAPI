using Ecomm.Application.DTOs.Categories;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Categories;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Categories;

public class UpdateCategoryUseCase : IUpdateCategoryUseCase
{
    private readonly ICategoryRepo _categoryRepo;
    private readonly ILogger<UpdateCategoryUseCase> _logger;

    public UpdateCategoryUseCase(ICategoryRepo categoryRepo, ILogger<UpdateCategoryUseCase> logger)
    {
        _categoryRepo = categoryRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id, UpdateCategoryDTO dto)
    {
        var category = await _categoryRepo.GetByIdAsync(id);
        if (category == null)
            throw new CategoryNotFoundException(id);

        category.UpdateName(dto.Name);
        await _categoryRepo.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} renamed to {CategoryName}", id, category.Name);
    }
}
