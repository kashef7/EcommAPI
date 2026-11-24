namespace Ecomm.Domain.Exceptions;

public class ProductVariantNotFoundException : DomainException
{
    public ProductVariantNotFoundException(Guid? id = null)
        : base(id.HasValue ? $"Product variant {id} was not found." : "Product variant not found.")
    {
    }
}
