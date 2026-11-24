using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class DeleteProductVariantUseCase : IDeleteProductVariantUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<DeleteProductVariantUseCase> _logger;

    public DeleteProductVariantUseCase(
        IProductRepo productRepo,
        ICartRepo cartRepo,
        ILogger<DeleteProductVariantUseCase> logger)
    {
        _productRepo = productRepo;
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid productId, Guid variantId)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        product.DeleteVariant(variantId);

        await _cartRepo.RemoveVariantFromAllCartsAsync(variantId);
        await _productRepo.SaveChangesAsync();

        _logger.LogInformation("Deleted variant {VariantId} from product {ProductId}", variantId, productId);
    }
}
