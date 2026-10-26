namespace Ecomm.Application.Exceptions;

public class EmailAlreadyExistsException : AppException
{
    public EmailAlreadyExistsException() : base("Email already exists")
    { }

    public EmailAlreadyExistsException(string email) : base($"{email} is already exist")
    { }
}
