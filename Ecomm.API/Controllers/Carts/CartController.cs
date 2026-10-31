using System.Security.Claims;
using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Carts;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CartController:ControllerBase
{
    private readonly IAddCartItemUseCase _addCartItemUseCase;
    private readonly IGetCartItemsUseCase _getCartItemsUseCase;

    public CartController(IAddCartItemUseCase addCartItemUseCase, IGetCartItemsUseCase getCartItemsUseCase)
    {
        _addCartItemUseCase = addCartItemUseCase;
        _getCartItemsUseCase = getCartItemsUseCase;
    }

    [HttpPost]
    public async Task<IActionResult> AddCartItem(AddCartItemDTO addCartItemDto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        await _addCartItemUseCase.ExecuteAsync(userId, addCartItemDto);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetCartItems()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }
        var result = await _getCartItemsUseCase.ExecuteAsync(userId);
        return Ok(result);
    }
}