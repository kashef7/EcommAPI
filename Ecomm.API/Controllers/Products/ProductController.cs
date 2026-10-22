using Ecomm.Application.DTOs.ProductDTO;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Products;


[ApiController]
[Authorize]
[Route("products")]
public class ProductController:ControllerBase
{
    private readonly IAddProductUseCase _addProductUseCase;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;

    public ProductController(IAddProductUseCase addProductUseCase, IGetProductByIdUseCase getProductByIdUseCase)
    {
        _addProductUseCase = addProductUseCase;
        _getProductByIdUseCase = getProductByIdUseCase;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProductById(Guid id)
    {
        var product = await _getProductByIdUseCase.ExecuteAsync(id);
        return Ok(product);
    }
    
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddProduct(AddProductDTO addProductDto)
    {
        var newProduct = await _addProductUseCase.ExecuteAsync(addProductDto);
        return CreatedAtAction(nameof(GetProductById), new { id = newProduct.Id }, newProduct);
    }
}
