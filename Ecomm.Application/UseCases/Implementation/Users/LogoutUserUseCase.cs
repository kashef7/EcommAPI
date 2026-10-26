using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class LogoutUserUseCase : ILogoutUserUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ILogger<LogoutUserUseCase> _logger;

    public LogoutUserUseCase(IUserRepo userRepo, ILogger<LogoutUserUseCase> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var user = await _userRepo.GetUserByIdAsync(id);
        if (user == null)
        {
            throw new UserNotFoundException();
        }
        user.RemoveRefreshToken();
        await _userRepo.SaveChangesAsync();
        _logger.LogInformation("User {UserId} logged out", id);
    }
}
