using Ecomm.Application.DTOs.Users;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface ILoginUserUseCase
{
    Task<AuthUserDTO> ExecuteAsync(LoginUserDTO user);
}
