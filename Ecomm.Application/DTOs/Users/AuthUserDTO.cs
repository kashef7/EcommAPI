namespace Ecomm.Application.DTOs.Users;

public record AuthUserDTO(string Name, string Email, string RefreshToken, string AccessToken, int AccessExpiresIn, DateTime RefreshTokenExpiresAt);
