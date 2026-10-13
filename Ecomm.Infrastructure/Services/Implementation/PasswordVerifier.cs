using Ecomm.Application.Services.Abstraction;

namespace Ecomm.Infrastructure.Services.Implementation;

public class PasswordVerifier : IPasswordVerifier
{
    public bool IsPasswordCorrect(string password, string passwordHash)
    {
        return BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
}