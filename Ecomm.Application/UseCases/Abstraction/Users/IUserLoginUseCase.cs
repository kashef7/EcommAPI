using Ecomm.Application.DTOs.UserDTO;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUserLoginUseCase
{
    Task<AuthUserDTO> ExecuteAsync(UserLoginDTO user);
}