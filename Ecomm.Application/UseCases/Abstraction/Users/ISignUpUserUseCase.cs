using Ecomm.Application.DTOs.Users;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface ISignUpUserUseCase
{
    Task<AuthUserDTO> ExecuteAsync(SignUpUserDTO user);
}
