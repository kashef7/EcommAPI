namespace Ecomm.Application.Services.Abstraction;

public interface ITokenVerifier
{
    bool IsTokenValid(string token,string tokenHash);
}