namespace Ecomm.Application.Services.Abstraction;

public interface IPasswordHasher
{
    string HashPassword(string password);
}