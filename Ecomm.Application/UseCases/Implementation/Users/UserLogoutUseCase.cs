using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IUserRepo;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UserLogoutUseCase : IUserLogoutUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ILogger<UserSignUpUseCase> _logger;

    public UserLogoutUseCase(IUserRepo userRepo, ILogger<UserSignUpUseCase> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }
    public async Task ExecuteAsync(Guid id)
    {
        var user = await  _userRepo.GetUserByIdAsync(id);
        if (user == null)
        {
            throw new UserNotFoundException();
        }
        user.RemoveRefreshToken();
        await _userRepo.SaveChangesAsync();
        _logger.LogInformation("User {UserId} logged out", id);
        return;

    }
}
