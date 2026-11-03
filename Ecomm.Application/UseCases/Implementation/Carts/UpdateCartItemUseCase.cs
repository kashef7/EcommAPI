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
    private readonly IUserRepo _userRepo;
    private readonly ILogger<UpdateCartItemUseCase> _logger;

    public UpdateCartItemUseCase(ICartRepo cartRepo, IProductRepo productRepo, IUserRepo userRepo ,ILogger<UpdateCartItemUseCase> logger)
    {
        _cartRepo = cartRepo;
        _productRepo = productRepo;
        _userRepo = userRepo;
        _logger = logger;
    }
    
    public async Task ExecuteAsync(Guid userId,Guid productId ,UpdateCartItemQuantityDTO updateCartItemQuantityDto)
    {
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new UserNotFoundException();
        }

        var cart = await _cartRepo.GetCartByUserIdAsync(userId);
        
        var product = await _productRepo.GetByIdAsync(productId);
        
        if (product == null)
        {
            throw new ProductNotFoundException();
        }
        
        cart!.UpdateItemQuantity(product, updateCartItemQuantityDto.Quantity);
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation($"Cart item {productId} has been updated.");
    }
}