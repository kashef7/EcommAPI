using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class GetProductByIdUseCase : IGetProductByIdUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<GetProductByIdUseCase> _logger;

    public GetProductByIdUseCase(IProductRepo productRepo, ILogger<GetProductByIdUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }

    public async Task<GetProductDetailDTO> ExecuteAsync(Guid productId)
    {
        var product = await _productRepo.GetByIdWithDetailsAsync(productId);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }

        var categoryDto = new CategoryReferenceDTO(product.Category.Id, product.Category.Name);
        var tags = product.ProductTags.Select(pt => pt.Tag.Name).ToList();
        var images = product.Images
            .OrderBy(i => i.SortOrder)
            .Select(i => new ProductImageDetailDTO(i.Url, i.SortOrder))
            .ToList();

        var options = product.Options
            .OrderBy(o => o.SortOrder)
            .Select(o => new ProductOptionDetailDTO(o.Name, o.Values.Select(v => v.Value).ToList()))
            .ToList();

        var variants = product.Variants
            .Select(v =>
            {
                var optionValuesMap = v.OptionValues
                    .Where(ov => ov.OptionValue?.Option != null)
                    .OrderBy(ov => ov.OptionValue.Option.SortOrder)
                    .ToDictionary(ov => ov.OptionValue.Option.Name, ov => ov.OptionValue.Value);

                return new ProductVariantDetailDTO(v.Id, v.Price, v.StockQuantity, optionValuesMap);
            })
            .ToList();

        return new GetProductDetailDTO(
            product.Id,
            product.Name,
            product.Description,
            categoryDto,
            tags,
            images,
            options,
            variants,
            product.CreatedAt);
    }
}
