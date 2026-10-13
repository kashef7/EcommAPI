namespace Ecomm.Application.Exceptions;

public class InvalidCredentialsException : Exception
{
    public  InvalidCredentialsException() : base("Invalid Email or Password")
    {}
}