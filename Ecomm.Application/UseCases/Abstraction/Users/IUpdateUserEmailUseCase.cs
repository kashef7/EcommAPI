using Ecomm.Application.DTOs.Users;

namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface IUpdateUserEmailUseCase
{
    Task ExecuteAsync(Guid id, UpdateUserEmailDTO dto);
}
