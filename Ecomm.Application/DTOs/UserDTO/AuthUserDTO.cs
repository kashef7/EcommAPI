using Ecomm.Domain.ValueObjects;

namespace Ecomm.Application.DTOs.UserDTO;

public record AuthUserDTO(string name, string email, string refreshToken,string accessToken, int accessExpiresIn, DateTime refreshTokenExpiresAt);