using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class AddCartItemUseCase : IAddCartItemUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<AddCartItemUseCase> _logger;

    public AddCartItemUseCase(IProductRepo productRepo, ICartRepo cartRepo, ILogger<AddCartItemUseCase> logger)
    {
        _productRepo = productRepo;
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid userId, AddCartItemDTO addCartItemDto)
    {
        var cart = await _cartRepo.GetOrCreateCartAsync(userId);
        
        var variant = await _productRepo.GetVariantByIdAsync(addCartItemDto.VariantId);
        if (variant == null)
        {
            throw new VariantNotFoundException(addCartItemDto.VariantId);
        }

        cart.AddItem(variant, addCartItemDto.Quantity);
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation("Added {Quantity} of variant {VariantId} to cart for user {UserId}", addCartItemDto.Quantity, variant.Id, userId);
    }
}
