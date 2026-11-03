using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class DeleteProductUseCase : IDeleteProductUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<DeleteProductUseCase> _logger;

    public DeleteProductUseCase(IProductRepo productRepo, ICartRepo cartRepo, ILogger<DeleteProductUseCase> logger)
    {
        _productRepo = productRepo;
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var product = await _productRepo.GetByIdAsync(id);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }

        product.Delete();
        await _productRepo.SaveChangesAsync();
        await _cartRepo.RemoveProductFromAllCartsAsync(product.Id);
        _logger.LogInformation("Product {ProductId} ({ProductName}) soft-deleted", product.Id, product.Name);
    }
}
