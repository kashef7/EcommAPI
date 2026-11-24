using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class AddProductVariantUseCase : IAddProductVariantUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;
    private readonly ILogger<AddProductVariantUseCase> _logger;

    public AddProductVariantUseCase(
        IProductRepo productRepo,
        IGetProductByIdUseCase getProductByIdUseCase,
        ILogger<AddProductVariantUseCase> logger)
    {
        _productRepo = productRepo;
        _getProductByIdUseCase = getProductByIdUseCase;
        _logger = logger;
    }

    public async Task<GetProductDetailDTO> ExecuteAsync(Guid productId, AddProductVariantDTO dto)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        product.AddVariant(dto.OptionValues, dto.Price, dto.StockQuantity);

        await _productRepo.SaveChangesAsync();
        _logger.LogInformation("Added variant to product {ProductId}", productId);

        return await _getProductByIdUseCase.ExecuteAsync(productId);
    }
}
