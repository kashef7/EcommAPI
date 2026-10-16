using System.Security.Cryptography;
using System.Text;
using Ecomm.Application.Services.Abstraction;

namespace Ecomm.Infrastructure.Services.Implementation;

public class TokenVerifier : ITokenVerifier
{
    public bool IsTokenValid(string token, string tokenHash)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(tokenHash))
            return false;
        
        byte[] computedHashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        string computedHashHex = Convert.ToHexString(computedHashBytes);


        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedHashHex),
            Encoding.UTF8.GetBytes(tokenHash.ToUpperInvariant())
        );
    }
}