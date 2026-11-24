using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class RenameProductOptionUseCase : IRenameProductOptionUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;
    private readonly ILogger<RenameProductOptionUseCase> _logger;

    public RenameProductOptionUseCase(
        IProductRepo productRepo,
        IGetProductByIdUseCase getProductByIdUseCase,
        ILogger<RenameProductOptionUseCase> logger)
    {
        _productRepo = productRepo;
        _getProductByIdUseCase = getProductByIdUseCase;
        _logger = logger;
    }

    public async Task<GetProductDetailDTO> ExecuteAsync(Guid productId, Guid optionId, RenameProductOptionDTO dto)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        product.RenameOption(optionId, dto.Name);

        await _productRepo.SaveChangesAsync();
        _logger.LogInformation("Renamed option {OptionId} on product {ProductId} to {NewName}", optionId, productId, dto.Name);

        return await _getProductByIdUseCase.ExecuteAsync(productId);
    }
}
