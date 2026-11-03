using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class GetCartItemsUseCase : IGetCartItemsUseCase
{
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<GetCartItemsUseCase> _logger;

    public GetCartItemsUseCase(ICartRepo cartRepo, ILogger<GetCartItemsUseCase> logger)
    {
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task<GetCartItemsDTO> ExecuteAsync(Guid userId)
    {
        var cart = await _cartRepo.GetOrCreateCartAsync(userId);
        if (cart.Items.Count == 0)
        {
            return new GetCartItemsDTO([], 0m);
        }

        var items = cart.Items
            .Select(item => new CartItemDTO(
                item.ProductId,
                item.Product.Name,
                item.Product.Price,
                item.Quantity,
                item.Product.Price * item.Quantity))
            .ToList();

        var totalPrice = items.Sum(i => i.LineTotal);

        return new GetCartItemsDTO(items, totalPrice);
    }
}
