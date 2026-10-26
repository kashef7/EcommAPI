using Ecomm.Application.DTOs.Users;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UpdateUserPasswordUseCase : IUpdateUserPasswordUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPasswordVerifier _passwordVerifier;
    private readonly ILogger<UpdateUserPasswordUseCase> _logger;

    public UpdateUserPasswordUseCase(
        IUserRepo userRepo,
        IPasswordHasher passwordHasher,
        IPasswordVerifier passwordVerifier,
        ILogger<UpdateUserPasswordUseCase> logger)
    {
        _userRepo = userRepo;
        _passwordHasher = passwordHasher;
        _passwordVerifier = passwordVerifier;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id, UpdateUserPasswordDTO dto)
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
        user.UpdatePasswordHash(newPasswordHash);
        await _userRepo.SaveChangesAsync();
        _logger.LogInformation("Password updated successfully for User {UserId}", user.Id);
    }
}
