namespace Ecomm.Application.UseCases.Abstraction.Users;

public interface ILogoutUserUseCase
{
    Task ExecuteAsync(Guid id);
}
