using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class AddProductOptionValueUseCase : IAddProductOptionValueUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;
    private readonly ILogger<AddProductOptionValueUseCase> _logger;

    public AddProductOptionValueUseCase(
        IProductRepo productRepo,
        IGetProductByIdUseCase getProductByIdUseCase,
        ILogger<AddProductOptionValueUseCase> logger)
    {
        _productRepo = productRepo;
        _getProductByIdUseCase = getProductByIdUseCase;
        _logger = logger;
    }

    public async Task<GetProductDetailDTO> ExecuteAsync(Guid productId, Guid optionId, AddProductOptionValueDTO dto)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        product.AddOptionValue(optionId, dto.Value);

        await _productRepo.SaveChangesAsync();
        _logger.LogInformation("Added value {Value} to option {OptionId} on product {ProductId}", dto.Value, optionId, productId);

        return await _getProductByIdUseCase.ExecuteAsync(productId);
    }
}
