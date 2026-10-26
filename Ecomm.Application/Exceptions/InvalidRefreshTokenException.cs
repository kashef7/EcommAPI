namespace Ecomm.Application.Exceptions;

public class InvalidRefreshTokenException : AppException
{
    public InvalidRefreshTokenException() : base("The refresh token is invalid.")
    { }
}
