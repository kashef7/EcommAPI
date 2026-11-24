using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class AddProductOptionUseCase : IAddProductOptionUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;
    private readonly ILogger<AddProductOptionUseCase> _logger;

    public AddProductOptionUseCase(
        IProductRepo productRepo,
        IGetProductByIdUseCase getProductByIdUseCase,
        ILogger<AddProductOptionUseCase> logger)
    {
        _productRepo = productRepo;
        _getProductByIdUseCase = getProductByIdUseCase;
        _logger = logger;
    }

    public async Task<GetProductDetailDTO> ExecuteAsync(Guid productId, AddProductOptionDTO dto)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        product.AddOption(dto.Name, dto.Values, dto.ExistingVariantsValue);

        await _productRepo.SaveChangesAsync();
        _logger.LogInformation("Added option {OptionName} to product {ProductId}", dto.Name, productId);

        return await _getProductByIdUseCase.ExecuteAsync(productId);
    }
}
