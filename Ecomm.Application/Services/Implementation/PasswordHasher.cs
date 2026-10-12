using Ecomm.Application.Services.Abstraction;

namespace Ecomm.Application.Services.Implementation;

public class PasswordHasher:IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password,12);
    }
}