using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IUserRepo;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UserUpdatePasswordUseCase : IUserUpdatePasswordUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPasswordVerifier _passwordVerifier;
    private readonly ILogger<UserUpdatePasswordUseCase> _logger;

    public UserUpdatePasswordUseCase(
        IUserRepo userRepo,
        IPasswordHasher passwordHasher,
        IPasswordVerifier passwordVerifier,
        ILogger<UserUpdatePasswordUseCase> logger)
    {
        _userRepo = userRepo;
        _passwordHasher = passwordHasher;
        _passwordVerifier = passwordVerifier;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id, UpdatePasswordDTO dto)
    {
        var user = await _userRepo.GetUserByIdAsync(id);
        if (user == null)
        {
            throw new UserNotFoundException();
        }

        if (!_passwordVerifier.IsPasswordCorrect(dto.OldPassword, user.PasswordHash))
        {
            throw new IncorrectPasswordException();
        }

        var newPasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
        user.UpdateUserPasswordHash(newPasswordHash);
        await _userRepo.SaveChangesAsync();
        _logger.LogInformation("Password updated successfully for User {UserId}", user.Id);
    }
}
