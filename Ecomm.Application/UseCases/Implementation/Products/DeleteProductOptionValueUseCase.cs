using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class DeleteProductOptionValueUseCase : IDeleteProductOptionValueUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<DeleteProductOptionValueUseCase> _logger;

    public DeleteProductOptionValueUseCase(
        IProductRepo productRepo,
        ILogger<DeleteProductOptionValueUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid productId, Guid optionId, Guid valueId)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        var val = product.DeleteOptionValue(optionId, valueId);

        await _productRepo.DeleteOptionValueAsync(product, val);
        _logger.LogInformation("Deleted value {ValueId} from option {OptionId} on product {ProductId}", valueId, optionId, productId);
    }
}
