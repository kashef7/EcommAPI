namespace Ecomm.Domain.Exceptions;

public class InsufficientStockException : DomainException
{
    public InsufficientStockException(Guid productId, int requested, int available)
        : base($"Product {productId} has insufficient stock: requested {requested}, but only {available} available.")
    {
    }
}
