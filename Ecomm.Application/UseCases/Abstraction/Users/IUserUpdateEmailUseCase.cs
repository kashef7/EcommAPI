using Ecomm.Application.DTOs.UserDTO;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUserUpdateEmailUseCase
{
    Task ExecuteAsync(Guid id, UpdateEmailDTO dto);
}
