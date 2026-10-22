using Ecomm.Application.DTOs.ProductDTO;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IProductRepo;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class GetProductByIdUseCase : IGetProductByIdUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<GetProductByIdUseCase> _logger;

    public GetProductByIdUseCase(IProductRepo productRepo, ILogger<GetProductByIdUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }
    public async Task<GetProductDTO> ExecuteAsync(Guid productId)
    {
        var product = await _productRepo.GetByIdAsync(productId);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }
        return new GetProductDTO(product.Id,product.Name,product.Description,product.ImageUrl,product.Tag,product.Price,product.StockQuantity,product.CreatedAt);
        
    }
}
