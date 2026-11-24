using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class DeleteProductOptionUseCase : IDeleteProductOptionUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<DeleteProductOptionUseCase> _logger;

    public DeleteProductOptionUseCase(
        IProductRepo productRepo,
        ILogger<DeleteProductOptionUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid productId, Guid optionId)
    {
        var product = await _productRepo.GetByIdForOptionsUpdateAsync(productId)
            ?? throw new ProductNotFoundException();

        var (option, _) = product.DeleteOption(optionId);

        await _productRepo.DeleteOptionAsync(product, option);
        _logger.LogInformation("Deleted option {OptionId} from product {ProductId}", optionId, productId);
    }
}
