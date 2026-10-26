using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Domain.Entities.Users;
using Ecomm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Ecomm.Infrastructure.Repositories.Implementation;

public class UserRepo : IUserRepo
{
    private readonly AppDbContext _dbContext;
    
    public UserRepo(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<User?> GetUserByEmailAsync(string email)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        return user;
    }

    public async Task<User?> GetUserByIdAsync(Guid id)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
        return user;
    }

    public async Task<User?> GetUserByRefreshTokenHashAsync(string refreshTokenHash)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(u => u.RefreshToken != null && u.RefreshToken.TokenHash == refreshTokenHash);
    }
    
    public async Task AddUserAsync(User user)
    {
        await _dbContext.Users.AddAsync(user);
    }

    public async Task SaveChangesAsync()
    {
        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            throw new EmailAlreadyExistsException();
        }
    }
}
