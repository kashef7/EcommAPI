using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Ecomm.Domain.Entities.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class AddProductUseCase : IAddProductUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ICategoryRepo _categoryRepo;
    private readonly ITagRepo _tagRepo;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;
    private readonly ILogger<AddProductUseCase> _logger;

    public AddProductUseCase(
        IProductRepo productRepo,
        ICategoryRepo categoryRepo,
        ITagRepo tagRepo,
        IGetProductByIdUseCase getProductByIdUseCase,
        ILogger<AddProductUseCase> logger)
    {
        _productRepo = productRepo;
        _categoryRepo = categoryRepo;
        _tagRepo = tagRepo;
        _getProductByIdUseCase = getProductByIdUseCase;
        _logger = logger;
    }

    public async Task<GetProductDetailDTO> ExecuteAsync(AddProductDTO dto)
    {
        var category = await _categoryRepo.GetByIdAsync(dto.CategoryId);
        if (category == null)
        {
            throw new CategoryNotFoundException(dto.CategoryId);
        }

        var product = new Product(dto.Name, dto.Description, dto.CategoryId);

        if (dto.ImageUrls != null)
        {
            product.SetImages(dto.ImageUrls);
        }

        if (dto.Tags != null && dto.Tags.Length > 0)
        {
            var tags = await _tagRepo.GetOrCreateTagsAsync(dto.Tags);
            product.SetTags(tags);
        }

        var optionsInput = dto.Options?
            .Select(o => (o.Name, (IReadOnlyList<string>)o.Values))
            .ToList();

        var variantsInput = dto.Variants
            .Select(v => ((IReadOnlyDictionary<string, string>?)v.OptionValues, v.Price, v.StockQuantity))
            .ToList();

        product.ConfigureOptionsAndVariants(optionsInput, variantsInput);

        await _productRepo.AddAsync(product);
        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} ({ProductName}) added successfully", product.Id, product.Name);

        return await _getProductByIdUseCase.ExecuteAsync(product.Id);
    }
}
