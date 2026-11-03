using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class ClearCartUseCase: IClearCartUseCase
{
    private readonly ICartRepo _cartRepo;
    private readonly IUserRepo _userRepo;
    private readonly ILogger<RemoveCartItemUseCase> _logger;

    public ClearCartUseCase(ICartRepo cartRepo, IUserRepo userRepo, ILogger<RemoveCartItemUseCase> logger)
    {
        _cartRepo = cartRepo;
        _userRepo = userRepo;
        _logger = logger;
    }
    public async Task ExecuteAsync(Guid userId)
    {
        var user = await _userRepo.GetUserByIdAsync(userId);
        if (user == null)
        {
            throw new UserNotFoundException();
        }
        var cart = await _cartRepo.GetCartByUserIdAsync(userId);
        cart!.Clear();
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation($"Cart has been cleared.");
    }
}