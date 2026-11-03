namespace Ecomm.Domain.Exceptions;

public class CartItemNotFoundException : DomainException
{
    public CartItemNotFoundException(Guid productId)
        : base($"Product {productId} was not found in cart.")
    {
    }
}
