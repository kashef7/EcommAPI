using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class UpdateProductUseCase : IUpdateProductUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ICategoryRepo _categoryRepo;
    private readonly ITagRepo _tagRepo;
    private readonly ILogger<UpdateProductUseCase> _logger;

    public UpdateProductUseCase(
        IProductRepo productRepo,
        ICategoryRepo categoryRepo,
        ITagRepo tagRepo,
        ILogger<UpdateProductUseCase> logger)
    {
        _productRepo = productRepo;
        _categoryRepo = categoryRepo;
        _tagRepo = tagRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id, UpdateProductDTO productDto)
    {
        var product = await _productRepo.GetByIdForUpdateAsync(id);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }

        if (productDto.Name != null)
        {
            product.UpdateName(productDto.Name);
        }

        if (productDto.Description != null)
        {
            product.UpdateDescription(productDto.Description);
        }

        if (productDto.CategoryId.HasValue)
        {
            var category = await _categoryRepo.GetByIdAsync(productDto.CategoryId.Value);
            if (category == null)
            {
                throw new CategoryNotFoundException(productDto.CategoryId.Value);
            }
            product.UpdateCategory(productDto.CategoryId.Value);
        }

        if (productDto.ImageUrls != null)
        {
            // Null means unchanged, an empty list clears, a provided list replaces everything
            product.SetImages(productDto.ImageUrls);
        }

        if (productDto.Tags != null)
        {
            // Null means unchanged, an empty list clears, a provided list replaces everything
            if (productDto.Tags.Length == 0)
            {
                product.SetTags([]);
            }
            else
            {
                var tags = await _tagRepo.GetOrCreateTagsAsync(productDto.Tags);
                product.SetTags(tags);
            }
        }

        await _productRepo.SaveChangesAsync();
        _logger.LogInformation("Product {ProductId} updated", id);
    }
}
