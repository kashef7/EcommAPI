namespace Ecomm.Application.Exceptions;

public class EmailAlreadyExistException : AppException
{
    public EmailAlreadyExistException() : base("Email already exists")
    { }

    public EmailAlreadyExistException(string email) : base($"{email} is already exist")
    { }
}