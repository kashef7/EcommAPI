using Ecomm.Application.DTOs.ProductDTO;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IProductRepo;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class UpdateProductUseCase:IUpdateProductUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<UpdateProductUseCase> _logger;


    public UpdateProductUseCase(IProductRepo productRepo, ILogger<UpdateProductUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }
    
    public async Task ExecuteAsync(Guid id,UpdateProductDTO productDto)
    {
        var product = await _productRepo.GetByIdAsync(id);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }
        if (productDto.Name != null)
        {
            product.UpdateName(productDto.Name);
        }
        if (productDto.Description != null)
        {
            product.UpdateDescription(productDto.Description);
        }
        if (productDto.Price != null)
        {
            product.UpdatePrice(productDto.Price.Value);
        }
        if (productDto.Tag != null)
        {
            product.UpdateTag(productDto.Tag);
        }
        if (productDto.Stock != null)
        {
            product.UpdateStockQuantity(productDto.Stock.Value);
        }
        if (productDto.ImgUrl != null)
        {
            product.UpdateImageUrl(productDto.ImgUrl);
        }
        await _productRepo.SaveChangesAsync();
    }
}