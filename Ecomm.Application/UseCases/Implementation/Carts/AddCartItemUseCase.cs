using System.Diagnostics;
using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Ecomm.Domain.Entities.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class AddCartItemUseCase:IAddCartItemUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly IProductRepo _productRepo;
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<Cart>  _logger;

    public AddCartItemUseCase(IUserRepo userRepo, IProductRepo productRepo, ICartRepo cartRepo, ILogger<Cart> logger)
    {
        _userRepo = userRepo;
        _productRepo = productRepo;
        _cartRepo = cartRepo;
        _logger = logger;
    }
    public async Task ExecuteAsync(Guid userId, AddCartItemDTO addCartItemDto)
    {
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new UserNotFoundException();
        }
        var cart = await _cartRepo.GetCartByUserIdAsync(user.Id);
        
        var product = await _productRepo.GetByIdAsync(addCartItemDto.ProductId);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }
        cart!.AddItem(product, addCartItemDto.Quantity);
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation($"Added {addCartItemDto.Quantity} of {product.Name}  to cart successfully");
    }
}