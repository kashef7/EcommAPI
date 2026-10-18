using Ecomm.Application.DTOs.UserDTO;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUserGetMeUseCase
{
    Task<GetMeUserDTO> ExecuteAsync(Guid id);
}