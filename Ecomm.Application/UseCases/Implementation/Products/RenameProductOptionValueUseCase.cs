using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class RenameProductOptionValueUseCase : IRenameProductOptionValueUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;
    private readonly ILogger<RenameProductOptionValueUseCase> _logger;

    public RenameProductOptionValueUseCase(
        IProductRepo productRepo,
        IGetProductByIdUseCase getProductByIdUseCase,
        ILogger<RenameProductOptionValueUseCase> logger)
    {
        _productRepo = productRepo;
        _getProductByIdUseCase = getProductByIdUseCase;
        _logger = logger;
    }

    public async Task<GetProductDetailDTO> ExecuteAsync(Guid productId, Guid optionId, Guid valueId, RenameProductOptionValueDTO dto)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        product.RenameOptionValue(optionId, valueId, dto.Value);

        await _productRepo.SaveChangesAsync();
        _logger.LogInformation("Renamed value {ValueId} on option {OptionId} of product {ProductId} to {NewValue}", valueId, optionId, productId, dto.Value);

        return await _getProductByIdUseCase.ExecuteAsync(productId);
    }
}
