using Ecomm.Application.DTOs.Products;
using Ecomm.Application.UseCases.Abstraction.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Products;

[ApiController]
[Authorize]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IAddProductUseCase _addProductUseCase;
    private readonly IGetProductByIdUseCase _getProductByIdUseCase;
    private readonly IGetAllProductsUseCase _getAllProductsUseCase;
    private readonly IUpdateProductUseCase _updateProductUseCase;

    public ProductsController(
        IAddProductUseCase addProductUseCase,
        IGetProductByIdUseCase getProductByIdUseCase,
        IGetAllProductsUseCase getAllProductsUseCase,
        IUpdateProductUseCase updateProductUseCase)
    {
        _addProductUseCase = addProductUseCase;
        _getProductByIdUseCase = getProductByIdUseCase;
        _getAllProductsUseCase = getAllProductsUseCase;
        _updateProductUseCase = updateProductUseCase;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] ProductQueryParamsDTO queryParams)
    {
        var result = await _getAllProductsUseCase.ExecuteAsync(queryParams);
        return Ok(result);
    }

    [AllowAnonymous]
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

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateProduct(Guid id, UpdateProductDTO updateProductDto)
    {
        await _updateProductUseCase.ExecuteAsync(id, updateProductDto);
        return NoContent();
    }
}
