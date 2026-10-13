namespace Ecomm.Application.Services.Abstraction;

public interface IPasswordVerifier
{
    public bool IsPasswordCorrect(string password, string passwordHash);
}