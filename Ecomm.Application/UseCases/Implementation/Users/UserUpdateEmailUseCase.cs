using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IUserRepo;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UserUpdateEmailUseCase : IUserUpdateEmailUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ILogger<UserUpdateEmailUseCase> _logger;

    public UserUpdateEmailUseCase(IUserRepo userRepo, ILogger<UserUpdateEmailUseCase> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id, UpdateEmailDTO dto)
    {
        var user = await _userRepo.GetUserByIdAsync(id);
        if (user == null)
        {
            throw new UserNotFoundException();
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var existingUser = await _userRepo.GetUserByEmailAsync(normalizedEmail);
        if (existingUser != null)
        {
            throw new EmailAlreadyExistException(normalizedEmail);
        }

        user.UpdateUserEmail(normalizedEmail);
        await _userRepo.SaveChangesAsync();
        _logger.LogInformation("Email updated successfully for User {UserId}", user.Id);
    }
}
