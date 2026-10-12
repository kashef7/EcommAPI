using Ecomm.Application.DTOs.UserDTO;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUserSignUpUseCase
{
    Task<AuthUserDTO> ExecuteAsync(UserSignUpDTO user);
}