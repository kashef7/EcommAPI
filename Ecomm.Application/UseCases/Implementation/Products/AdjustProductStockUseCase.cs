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

    public async Task<ProductStockDTO> ExecuteAsync(Guid id, AdjustProductStockDTO dto)
    {
        var delta = dto.Delta!.Value;
        var rows = await _productRepo.AdjustStockAsync(id, delta);
        var current = await _productRepo.GetStockAsync(id);

        if (rows == 1)
        {
            if (current is null)
            {
                throw new ProductNotFoundException();
            }

            _logger.LogInformation("Stock for product {ProductId} adjusted by {Delta}. Resulting stock: {Stock}", id, delta, current.Value);
            return new ProductStockDTO(id, current.Value);
        }

        if (current is null)
        {
            throw new ProductNotFoundException();
        }

        if ((long)current.Value + delta < 0)
        {
            throw new InsufficientStockException(id, -delta, current.Value);
        }

        throw new DomainException($"Stock cannot exceed {Product.MaxStockQuantity}.");
    }
}
