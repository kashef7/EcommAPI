using Ecomm.Domain.Entities.Users;

namespace Ecomm.Application.Repositories.Abstraction;

public interface IUserRepo
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(Guid id);
    Task<User?> GetUserByRefreshTokenHashAsync(string refreshTokenHash);
    Task AddUserAsync(User user);
    Task SaveChangesAsync();
}
