namespace Ecomm.Application.Exceptions;

public class InValidRefreshToken:AppException
{
    public InValidRefreshToken() : base("The refresh token is invalid.")
    {}
}