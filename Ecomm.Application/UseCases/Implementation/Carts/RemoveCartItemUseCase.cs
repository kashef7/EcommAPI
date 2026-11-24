using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class RemoveCartItemUseCase : IRemoveCartItemUseCase
{
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<RemoveCartItemUseCase> _logger;

    public RemoveCartItemUseCase(ICartRepo cartRepo, ILogger<RemoveCartItemUseCase> logger)
    {
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid userId, Guid variantId)
    {
        var cart = await _cartRepo.GetOrCreateCartAsync(userId);
        cart.RemoveItem(variantId);
        await _cartRepo.SaveChangesAsync();
        _logger.LogInformation("Removed variant {VariantId} from cart for user {UserId}", variantId, userId);
    }
}
