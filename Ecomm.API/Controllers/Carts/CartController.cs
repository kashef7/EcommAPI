using Ecomm.API.Extensions;
using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Carts;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly IAddCartItemUseCase _addCartItemUseCase;
    private readonly IGetCartItemsUseCase _getCartItemsUseCase;
    private readonly IUpdateCartItemUseCase _updateCartItemUseCase;
    private readonly IRemoveCartItemUseCase _removeCartItemUseCase;
    private readonly IClearCartUseCase _clearCartUseCase;

    public CartController(
        IAddCartItemUseCase addCartItemUseCase,
        IGetCartItemsUseCase getCartItemsUseCase,
        IUpdateCartItemUseCase updateCartItemUseCase,
        IRemoveCartItemUseCase removeCartItemUseCase,
        IClearCartUseCase clearCartUseCase)
    {
        _addCartItemUseCase = addCartItemUseCase;
        _getCartItemsUseCase = getCartItemsUseCase;
        _updateCartItemUseCase = updateCartItemUseCase;
        _removeCartItemUseCase = removeCartItemUseCase;
        _clearCartUseCase = clearCartUseCase;
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddCartItem(AddCartItemDTO addCartItemDto)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        await _addCartItemUseCase.ExecuteAsync(userId, addCartItemDto);
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetCartItems()
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _getCartItemsUseCase.ExecuteAsync(userId);
        return Ok(result);
    }

    [HttpPut("items/{productId:guid}/quantity")]
    public async Task<IActionResult> UpdateCartItem(Guid productId, UpdateCartItemQuantityDTO updateCartItemQuantityDto)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        await _updateCartItemUseCase.ExecuteAsync(userId, productId, updateCartItemQuantityDto);
        return NoContent();
    }
    
    [HttpDelete("items/{productId:guid}")]
    public async Task<IActionResult> RemoveCartItem(Guid productId)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        await _removeCartItemUseCase.ExecuteAsync(userId, productId);
        return NoContent();
    }
    
    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        await _clearCartUseCase.ExecuteAsync(userId);
        return NoContent();
    }
}
