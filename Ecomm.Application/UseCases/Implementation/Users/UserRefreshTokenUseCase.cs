using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IUserRepo;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UserRefreshTokenUseCase : IUserRefreshTokenUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ITokenService _tokenService;
    private readonly ILogger<UserRefreshTokenUseCase> _logger;

    public UserRefreshTokenUseCase(
        IUserRepo userRepo, 
        ITokenService tokenService, 
        ILogger<UserRefreshTokenUseCase> logger)
    {
        _userRepo = userRepo;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthUserDTO> ExecuteAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new InValidRefreshToken();
        }
        
        var incomingTokenHash = _tokenService.HashRefreshToken(refreshToken);
        
        var user = await _userRepo.GetUserByRefreshTokenHashAsync(incomingTokenHash);
        if (user == null)
        {
            throw new InValidRefreshToken();
        }

        if (user.RefreshToken == null)
        {
            throw new NoUserRefreshTokenExist();
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