using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Exceptions;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class AdjustProductStockUseCase : IAdjustProductStockUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<AdjustProductStockUseCase> _logger;

    public AdjustProductStockUseCase(IProductRepo productRepo, ILogger<AdjustProductStockUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }

    public async Task<ProductStockDTO> ExecuteAsync(Guid productId, Guid variantId, AdjustProductStockDTO dto)
    {
        var variant = await _productRepo.GetVariantByIdAsync(variantId);
        if (variant == null || variant.ProductId != productId)
        {
            throw new VariantNotFoundException(variantId);
        }

        var delta = dto.Delta!.Value;
        var rows = await _productRepo.AdjustStockAsync(variantId, delta);
        var current = await _productRepo.GetStockAsync(variantId);

        if (rows == 1)
        {
            if (current is null)
            {
                throw new VariantNotFoundException(variantId);
            }

            _logger.LogInformation("Stock for variant {VariantId} adjusted by {Delta}. Resulting stock: {Stock}", variantId, delta, current.Value);
            return new ProductStockDTO(variantId, current.Value);
        }

        if (current is null)
        {
            throw new VariantNotFoundException(variantId);
        }

        if ((long)current.Value + delta < 0)
        {
            throw new InsufficientStockException(variantId, -delta, current.Value);
        }

        throw new DomainException($"Stock cannot exceed {ProductVariant.MaxStockQuantity}.");
    }
}
