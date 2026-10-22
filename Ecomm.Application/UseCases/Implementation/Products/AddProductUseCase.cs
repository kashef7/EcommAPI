using Ecomm.Application.DTOs.ProductDTO;
using Ecomm.Application.Repositories.Abstraction.IProductRepo;
using Ecomm.Application.UseCases.Abstraction.Products;
using Ecomm.Domain.Entities.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class AddProductUseCase:IAddProductUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<AddProductUseCase> _logger;

    public AddProductUseCase(IProductRepo productRepo, ILogger<AddProductUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }
    
    public async Task<GetProductDTO> ExecuteAsync(AddProductDTO product)
    {
        var newProduct = new Product(product.Name,product.Description,product.Price,product.Stock,product.Tag,product.ImgUrl);
        await _productRepo.AddAsync(newProduct);
        await _productRepo.SaveChangesAsync();
        _logger.LogInformation($"Product {newProduct.Name} added successfully");
        return new GetProductDTO(newProduct.Id,newProduct.Name,newProduct.Description,newProduct.ImageUrl,newProduct.Tag,newProduct.Price,newProduct.StockQuantity,newProduct.CreatedAt);
    }
}