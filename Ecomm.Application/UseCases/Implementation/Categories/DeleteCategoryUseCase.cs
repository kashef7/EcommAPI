using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Categories;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Categories;

public class DeleteCategoryUseCase : IDeleteCategoryUseCase
{
    private readonly ICategoryRepo _categoryRepo;
    private readonly ILogger<DeleteCategoryUseCase> _logger;

    public DeleteCategoryUseCase(ICategoryRepo categoryRepo, ILogger<DeleteCategoryUseCase> logger)
    {
        _categoryRepo = categoryRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var category = await _categoryRepo.GetByIdAsync(id);
        if (category == null)
            throw new CategoryNotFoundException(id);

        var hasProducts = await _categoryRepo.HasProductsAsync(id);
        if (hasProducts)
            throw new CategoryHasProductsException(id);

        _categoryRepo.Delete(category);
        await _categoryRepo.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} deleted", id);
    }
}
