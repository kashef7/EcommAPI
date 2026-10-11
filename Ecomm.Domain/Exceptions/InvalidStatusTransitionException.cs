namespace Ecomm.Domain.Exceptions;

public class InvalidStatusTransitionException : DomainException
{
    public InvalidStatusTransitionException(string entityName, string from, string to)
        : base($"{entityName} cannot move from {from} to {to}.")
    {
    }
}
