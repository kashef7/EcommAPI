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
    private readonly IDeleteProductUseCase _deleteProductUseCase;
    private readonly IUpdateVariantPriceUseCase _updateVariantPriceUseCase;
    private readonly IAdjustProductStockUseCase _adjustProductStockUseCase;
    private readonly IAddProductVariantUseCase _addProductVariantUseCase;
    private readonly IDeleteProductVariantUseCase _deleteProductVariantUseCase;
    private readonly IAddProductOptionUseCase _addProductOptionUseCase;
    private readonly IRenameProductOptionUseCase _renameProductOptionUseCase;
    private readonly IDeleteProductOptionUseCase _deleteProductOptionUseCase;
    private readonly IAddProductOptionValueUseCase _addProductOptionValueUseCase;
    private readonly IRenameProductOptionValueUseCase _renameProductOptionValueUseCase;
    private readonly IDeleteProductOptionValueUseCase _deleteProductOptionValueUseCase;

    public ProductsController(
        IAddProductUseCase addProductUseCase,
        IGetProductByIdUseCase getProductByIdUseCase,
        IGetAllProductsUseCase getAllProductsUseCase,
        IUpdateProductUseCase updateProductUseCase,
        IDeleteProductUseCase deleteProductUseCase,
        IUpdateVariantPriceUseCase updateVariantPriceUseCase,
        IAdjustProductStockUseCase adjustProductStockUseCase,
        IAddProductVariantUseCase addProductVariantUseCase,
        IDeleteProductVariantUseCase deleteProductVariantUseCase,
        IAddProductOptionUseCase addProductOptionUseCase,
        IRenameProductOptionUseCase renameProductOptionUseCase,
        IDeleteProductOptionUseCase deleteProductOptionUseCase,
        IAddProductOptionValueUseCase addProductOptionValueUseCase,
        IRenameProductOptionValueUseCase renameProductOptionValueUseCase,
        IDeleteProductOptionValueUseCase deleteProductOptionValueUseCase)
    {
        _addProductUseCase = addProductUseCase;
        _getProductByIdUseCase = getProductByIdUseCase;
        _getAllProductsUseCase = getAllProductsUseCase;
        _updateProductUseCase = updateProductUseCase;
        _deleteProductUseCase = deleteProductUseCase;
        _updateVariantPriceUseCase = updateVariantPriceUseCase;
        _adjustProductStockUseCase = adjustProductStockUseCase;
        _addProductVariantUseCase = addProductVariantUseCase;
        _deleteProductVariantUseCase = deleteProductVariantUseCase;
        _addProductOptionUseCase = addProductOptionUseCase;
        _renameProductOptionUseCase = renameProductOptionUseCase;
        _deleteProductOptionUseCase = deleteProductOptionUseCase;
        _addProductOptionValueUseCase = addProductOptionValueUseCase;
        _renameProductOptionValueUseCase = renameProductOptionValueUseCase;
        _deleteProductOptionValueUseCase = deleteProductOptionValueUseCase;
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

    [HttpPatch("{id:guid}/variants/{variantId:guid}")] //Note: Should be /price like the /stock since it is specific not general
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateVariantPrice(Guid id, Guid variantId, UpdateVariantPriceDTO dto)
    {
        await _updateVariantPriceUseCase.ExecuteAsync(id, variantId, dto);
        return NoContent();
    }

    [HttpPatch("{id:guid}/variants/{variantId:guid}/stock")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AdjustStock(Guid id, Guid variantId, AdjustProductStockDTO dto)
    {
        var result = await _adjustProductStockUseCase.ExecuteAsync(id, variantId, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        await _deleteProductUseCase.ExecuteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/variants")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddVariant(Guid id, AddProductVariantDTO dto)
    {
        var result = await _addProductVariantUseCase.ExecuteAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/variants/{variantId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteVariant(Guid id, Guid variantId)
    {
        await _deleteProductVariantUseCase.ExecuteAsync(id, variantId);
        return NoContent();
    }

    [HttpPost("{id:guid}/options")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddOption(Guid id, AddProductOptionDTO dto)
    {
        var result = await _addProductOptionUseCase.ExecuteAsync(id, dto);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/options/{optionId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> RenameOption(Guid id, Guid optionId, RenameProductOptionDTO dto)
    {
        var result = await _renameProductOptionUseCase.ExecuteAsync(id, optionId, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/options/{optionId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteOption(Guid id, Guid optionId)
    {
        await _deleteProductOptionUseCase.ExecuteAsync(id, optionId);
        return NoContent();
    }

    [HttpPost("{id:guid}/options/{optionId:guid}/values")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> AddOptionValue(Guid id, Guid optionId, AddProductOptionValueDTO dto)
    {
        var result = await _addProductOptionValueUseCase.ExecuteAsync(id, optionId, dto);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/options/{optionId:guid}/values/{valueId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> RenameOptionValue(Guid id, Guid optionId, Guid valueId, RenameProductOptionValueDTO dto)
    {
        var result = await _renameProductOptionValueUseCase.ExecuteAsync(id, optionId, valueId, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/options/{optionId:guid}/values/{valueId:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteOptionValue(Guid id, Guid optionId, Guid valueId)
    {
        await _deleteProductOptionValueUseCase.ExecuteAsync(id, optionId, valueId);
        return NoContent();
    }
}
