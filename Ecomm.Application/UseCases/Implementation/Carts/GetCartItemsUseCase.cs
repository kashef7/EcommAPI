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
        return await _cartRepo.GetCartDisplayAsync(userId);
    }
}
