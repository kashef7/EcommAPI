namespace Ecomm.Domain.Exceptions;

public class ProductOptionValueNotFoundException : DomainException
{
    public ProductOptionValueNotFoundException(Guid? id = null)
        : base(id.HasValue ? $"Product option value {id} was not found." : "Product option value not found.")
    {
    }
}
