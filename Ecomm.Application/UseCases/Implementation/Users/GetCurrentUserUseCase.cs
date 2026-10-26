using Ecomm.Application.DTOs.Users;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class GetCurrentUserUseCase : IGetCurrentUserUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ILogger<GetCurrentUserUseCase> _logger;

    public GetCurrentUserUseCase(IUserRepo userRepo, ILogger<GetCurrentUserUseCase> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }
    public async Task<GetCurrentUserDTO> ExecuteAsync(Guid id)
    {
        var user = await _userRepo.GetUserByIdAsync(id);
        if (user == null)
        {
            throw new UserNotFoundException();
        }
        return new GetCurrentUserDTO(user.Name, user.Email);
    }
}
