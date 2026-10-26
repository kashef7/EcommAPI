using Ecomm.Application.DTOs.Users;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUpdateUserPasswordUseCase
{
    Task ExecuteAsync(Guid id, UpdateUserPasswordDTO dto);
}
