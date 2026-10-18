using Ecomm.Application.DTOs.UserDTO;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUserUpdatePasswordUseCase
{
    Task ExecuteAsync(Guid id, UpdatePasswordDTO dto);
}
