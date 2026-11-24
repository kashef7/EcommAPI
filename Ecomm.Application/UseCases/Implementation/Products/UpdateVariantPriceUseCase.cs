using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class UpdateVariantPriceUseCase : IUpdateVariantPriceUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<UpdateVariantPriceUseCase> _logger;

    public UpdateVariantPriceUseCase(IProductRepo productRepo, ILogger<UpdateVariantPriceUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid productId, Guid variantId, UpdateVariantPriceDTO dto)
    {
        var variant = await _productRepo.GetVariantByIdAsync(variantId);
        if (variant == null || variant.ProductId != productId)
        {
            throw new VariantNotFoundException(variantId);
        }

        variant.UpdatePrice(dto.Price);
        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Variant {VariantId} for product {ProductId} price updated to {Price}", variantId, productId, dto.Price);
    }
}
