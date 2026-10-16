using Ecomm.Application.DTOs.UserDTO;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUserLogoutUseCase
{
    Task ExecuteAsync(Guid id);
}