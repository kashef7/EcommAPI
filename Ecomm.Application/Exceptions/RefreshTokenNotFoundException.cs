namespace Ecomm.Application.Exceptions;

public class RefreshTokenNotFoundException : AppException
{
    public RefreshTokenNotFoundException() : base("The User doesn't have a refresh token.")
    { }
}
