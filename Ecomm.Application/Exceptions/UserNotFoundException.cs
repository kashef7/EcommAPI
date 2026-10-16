namespace Ecomm.Application.Exceptions;

public class UserNotFoundException : AppException
{
    public UserNotFoundException(): base("User not found") { }
}