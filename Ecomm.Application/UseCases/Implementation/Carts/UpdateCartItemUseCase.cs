using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class UpdateCartItemUseCase : IUpdateCartItemUseCase
{
    private readonly ICartRepo _cartRepo;
    private readonly IProductRepo _productRepo;
    private readonly ILogger<UpdateCartItemUseCase> _logger;

    public UpdateCartItemUseCase(ICartRepo cartRepo, IProductRepo productRepo, ILogger<UpdateCartItemUseCase> logger)
    {
        _cartRepo = cartRepo;
        _productRepo = productRepo;
        _logger = logger;
    }
    
    public async Task ExecuteAsync(Guid userId, Guid productId, UpdateCartItemQuantityDTO updateCartItemQuantityDto)
    {
        var cart = await _cartRepo.GetOrCreateCartAsync(userId);
        
        var product = await _productRepo.GetByIdAsync(productId);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }
        
        cart.UpdateItemQuantity(product, updateCartItemQuantityDto.Quantity);
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation("Cart item {ProductId} has been updated for user {UserId}", productId, userId);
    }
}
