using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class UpdateCartItemUseCase : IUpdateCartItemUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<UpdateCartItemUseCase> _logger;

    public UpdateCartItemUseCase(IProductRepo productRepo, ICartRepo cartRepo, ILogger<UpdateCartItemUseCase> logger)
    {
        _productRepo = productRepo;
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid userId, Guid variantId, UpdateCartItemQuantityDTO updateCartItemQuantityDto)
    {
        var cart = await _cartRepo.GetOrCreateCartAsync(userId);

        var variant = await _productRepo.GetVariantByIdAsync(variantId);
        if (variant == null)
        {
            throw new VariantNotFoundException(variantId);
        }

        cart.UpdateItemQuantity(variant, updateCartItemQuantityDto.Quantity);
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation("Updated quantity of variant {VariantId} in cart to {Quantity} for user {UserId}", variantId, updateCartItemQuantityDto.Quantity, userId);
    }
}
