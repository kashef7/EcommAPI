using Ecomm.Domain.Entities.Users;

namespace Ecomm.Application.Repositories.Abstraction.IUserRepo;

public interface IUserRepo
{
    Task<User?> GetUserByEmailAsync(string email);
    Task AddUserAsync(User user);
    Task SaveChangesAsync();
}