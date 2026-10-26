using Ecomm.Application.DTOs.Users;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class LoginUserUseCase : ILoginUserUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ITokenService _tokenService;
    private readonly IPasswordVerifier _passwordVerifier;
    private readonly ILogger<LoginUserUseCase> _logger;

    public LoginUserUseCase(IUserRepo userRepo, ITokenService tokenService, ILogger<LoginUserUseCase> logger, IPasswordVerifier passwordVerifier)
    {
        _userRepo = userRepo;
        _tokenService = tokenService;
        _logger = logger;
        _passwordVerifier = passwordVerifier;
    }

    public async Task<AuthUserDTO> ExecuteAsync(LoginUserDTO user)
    {
        var normalizedEmail = user.Email.Trim().ToLowerInvariant();
        var loggedInUser = await _userRepo.GetUserByEmailAsync(normalizedEmail);
        if (loggedInUser == null)
        {
            throw new InvalidCredentialsException();
        }

        if (!_passwordVerifier.IsPasswordCorrect(user.Password, loggedInUser.PasswordHash))
        {
            throw new InvalidCredentialsException();
        }
        var (accessToken, expiresIn) = _tokenService.GenerateAccessToken(loggedInUser);
        
        var (refreshTokenRaw, refreshTokenHash, refreshTokenExpiresAt) = _tokenService.GenerateRefreshToken(loggedInUser);
        
        loggedInUser.UpdateRefreshToken(refreshTokenHash, refreshTokenExpiresAt);
        await _userRepo.SaveChangesAsync();
        _logger.LogInformation("User {UserId} logged in successfully", loggedInUser.Id);
        return new AuthUserDTO(loggedInUser.Name, loggedInUser.Email, refreshTokenRaw, accessToken, expiresIn, refreshTokenExpiresAt);
    }
}
