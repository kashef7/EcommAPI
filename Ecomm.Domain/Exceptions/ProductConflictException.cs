namespace Ecomm.Domain.Exceptions;

public class ProductConflictException : DomainException
{
    public ProductConflictException(string message) : base(message)
    {
    }
}
