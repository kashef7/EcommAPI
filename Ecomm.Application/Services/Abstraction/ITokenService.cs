using Ecomm.Domain.Entities.Users;

namespace Ecomm.Application.Services.Abstraction;

public interface ITokenService
{
    public (string AccessToken, int ExpiresIn) GenerateAccessToken(User user);
    
    public (string RawToken, string TokenHash) GenerateRefreshToken(User user);
    
    public string HashRefreshToken(string refreshToken);
}