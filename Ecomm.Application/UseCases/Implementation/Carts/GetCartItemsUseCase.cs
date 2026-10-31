using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class GetCartItemsUseCase : IGetCartItemsUseCase
{
    private readonly ICartRepo _cartRepo;
    private readonly IUserRepo _userRepo;
    private readonly ILogger<GetCartItemsUseCase> _logger;

    public GetCartItemsUseCase(ICartRepo cartRepo, IUserRepo userRepo, ILogger<GetCartItemsUseCase> logger)
    {
        _cartRepo = cartRepo;
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task<GetCartItemsDTO> ExecuteAsync(Guid userId)
    {
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new UserNotFoundException();
        }

        var cart = await _cartRepo.GetCartByUserIdAsync(user.Id);
        if (cart == null || cart.Items == null || cart.Items.Count == 0)
        {
            return new GetCartItemsDTO(new List<CartItemDTO>(), 0m);
        }

        var totalPrice = await _cartRepo.GetCartTotalPriceAsync(cart.Id);
        IReadOnlyList<CartItemDTO> items = cart.Items
            .Select(item => new CartItemDTO(item.ProductId, item.Quantity))
            .ToList();

        return new GetCartItemsDTO(items, totalPrice);
    }
}
