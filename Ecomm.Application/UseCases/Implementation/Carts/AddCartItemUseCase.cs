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
        
        var product = await _productRepo.GetByIdAsync(addCartItemDto.ProductId);
        if (product == null)
        {
            throw new ProductNotFoundException();
        }

        cart.AddItem(product, addCartItemDto.Quantity);
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation("Added {Quantity} of {ProductName} ({ProductId}) to cart for user {UserId}", addCartItemDto.Quantity, product.Name, product.Id, userId);
    }
}
