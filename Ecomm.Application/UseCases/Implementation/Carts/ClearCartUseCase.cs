using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class ClearCartUseCase : IClearCartUseCase
{
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<ClearCartUseCase> _logger;

    public ClearCartUseCase(ICartRepo cartRepo, ILogger<ClearCartUseCase> logger)
    {
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid userId)
    {
        var cart = await _cartRepo.GetOrCreateCartAsync(userId);
        cart.Clear();
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation("Cart has been cleared for user {UserId}", userId);
    }
}
