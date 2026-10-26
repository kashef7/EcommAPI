using Ecomm.Application.DTOs.Users;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UpdateUserEmailUseCase : IUpdateUserEmailUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ILogger<UpdateUserEmailUseCase> _logger;

    public UpdateUserEmailUseCase(IUserRepo userRepo, ILogger<UpdateUserEmailUseCase> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id, UpdateUserEmailDTO dto)
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
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        user.UpdateEmail(normalizedEmail);
        await _userRepo.SaveChangesAsync();
        _logger.LogInformation("Email updated successfully for User {UserId}", user.Id);
    }
}
