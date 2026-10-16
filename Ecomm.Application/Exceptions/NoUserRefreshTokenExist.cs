namespace Ecomm.Application.Exceptions;

public class NoUserRefreshTokenExist:AppException
{
    public NoUserRefreshTokenExist() : base("The User doesn't have a refresh token.")
    {
    }
}