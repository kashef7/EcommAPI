namespace Ecomm.Application.Exceptions;

public class EmailAlreadyExistException : ApplicationException
{
    public EmailAlreadyExistException(string email) : base($"{email} is already exist")
    { }
}