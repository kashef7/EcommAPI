using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Domain.Entities.Users;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Ecomm.Infrastructure.Services.Implementation;

public class TokenService:ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }
    public (string AccessToken, int ExpiresIn) GenerateAccessToken(User user)
    {
        var claims = new List<Claim>()
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        if (user.IsAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        double expireIn = Convert.ToDouble(_config["Jwt:ExpireMinutes"]);
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireIn),
            signingCredentials: creds
        );
        
        return (new JwtSecurityTokenHandler().WriteToken(token),Convert.ToInt32(expireIn) * 60);
    }

    public (string RawToken, string TokenHash, DateTime ExpiresAt) GenerateRefreshToken(User user)
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        var rawToken = Convert.ToBase64String(randomBytes);
        
        var tokenHash = HashRefreshToken(rawToken);

        double expireDays = Convert.ToDouble(_config["Jwt:RefreshTokenExpireDays"]);
        var expiresAt = DateTime.UtcNow.AddDays(expireDays);

        return (rawToken, tokenHash, expiresAt);
    }

    public string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes);
    }
}