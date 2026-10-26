using Ecomm.Application.DTOs.Users;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IRefreshUserTokenUseCase
{
    Task<AuthUserDTO> ExecuteAsync(string refreshToken);
}
