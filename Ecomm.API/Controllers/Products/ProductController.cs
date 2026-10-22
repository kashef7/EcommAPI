using Ecomm.Application.DTOs.ProductDTO;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Products;


[ApiController]
[Authorize]
[Route("[controller]")]
public class ProductController:ControllerBase
{
    private readonly IAddProductUseCase _addProductUseCase;
    private readonly IGetProductById _getProductById;

    public ProductController(IAddProductUseCase addProductUseCase, IGetProductById getProductById)
    {
        _addProductUseCase = addProductUseCase;
        _getProductById = getProductById;
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProductById(Guid id)
    {
        var product = await _getProductById.ExecuteAsync(id);
        return Ok(product);
    }
    
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddProduct(AddProductDTO addProductDto)
    {
        var newProduct = await _addProductUseCase.ExecuteAsync(addProductDto);
        return Ok(newProduct);
    }
}