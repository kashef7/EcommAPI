namespace Ecomm.Domain.Exceptions;

public class CartItemNotFoundException : DomainException
{
    public CartItemNotFoundException(Guid variantId)
        : base($"Variant {variantId} was not found in cart.")
    {
    }
}
