using Ecomm.Application.DTOs.UserDTO;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUserRefreshTokenUseCase
{
    Task<AuthUserDTO> ExecuteAsync(string refreshToken);
}