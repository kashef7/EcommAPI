using Ecomm.Application.DTOs.Users;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class RefreshUserTokenUseCase : IRefreshUserTokenUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ITokenService _tokenService;
    private readonly ILogger<RefreshUserTokenUseCase> _logger;

    public RefreshUserTokenUseCase(
        IUserRepo userRepo, 
        ITokenService tokenService, 
        ILogger<RefreshUserTokenUseCase> logger)
    {
        _userRepo = userRepo;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthUserDTO> ExecuteAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new InvalidRefreshTokenException();
        }
        
        var incomingTokenHash = _tokenService.HashRefreshToken(refreshToken);
        
        var user = await _userRepo.GetUserByRefreshTokenHashAsync(incomingTokenHash);
        if (user == null)
        {
            throw new InvalidRefreshTokenException();
        }

        if (user.RefreshToken == null)
        {
            throw new RefreshTokenNotFoundException();
        }
        
        var refreshTokenExpiresAt = user.RefreshToken.ExpiresAt;
        if (refreshTokenExpiresAt <= DateTime.UtcNow)
        {
            throw new ExpiredRefreshTokenException();
        }
        
        var (accessToken, expiresIn) = _tokenService.GenerateAccessToken(user);
        var (newRefreshTokenRaw, newRefreshTokenHash, newRefreshTokenExpiresAt) = _tokenService.GenerateRefreshToken(user);
        
        user.UpdateRefreshToken(newRefreshTokenHash, newRefreshTokenExpiresAt);
        await _userRepo.SaveChangesAsync();
        
        _logger.LogInformation("Tokens Updated Successfully for User {UserId}", user.Id);
        
        return new AuthUserDTO(
            user.Name, 
            user.Email, 
            newRefreshTokenRaw, 
            accessToken, 
            expiresIn, 
            newRefreshTokenExpiresAt);
    }
}
