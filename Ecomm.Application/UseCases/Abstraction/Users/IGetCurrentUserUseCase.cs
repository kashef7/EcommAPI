using Ecomm.Application.DTOs.Users;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IGetCurrentUserUseCase
{
    Task<GetCurrentUserDTO> ExecuteAsync(Guid id);
}
