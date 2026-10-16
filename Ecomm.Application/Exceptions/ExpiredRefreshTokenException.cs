namespace Ecomm.Application.Exceptions;

public class ExpiredRefreshTokenException:AppException
{
    public ExpiredRefreshTokenException():base("The refresh token is expired.")
    {}
}