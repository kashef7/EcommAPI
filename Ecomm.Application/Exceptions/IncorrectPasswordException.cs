namespace Ecomm.Application.Exceptions;

public class IncorrectPasswordException : AppException
{
    public IncorrectPasswordException() : base("Incorrect password")
    { }

    public IncorrectPasswordException(string message) : base(message)
    { }
}

public class InvalidPasswordException : IncorrectPasswordException
{
    public InvalidPasswordException() : base("Invalid password")
    { }

    public InvalidPasswordException(string message) : base(message)
    { }
}

public class InvalidOldPasswordException : IncorrectPasswordException
{
    public InvalidOldPasswordException() : base("Invalid old password")
    { }

    public InvalidOldPasswordException(string message) : base(message)
    { }
}
