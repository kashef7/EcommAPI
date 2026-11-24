namespace Ecomm.Domain.Exceptions;

public class ProductOptionNotFoundException : DomainException
{
    public ProductOptionNotFoundException(Guid? id = null)
        : base(id.HasValue ? $"Product option {id} was not found." : "Product option not found.")
    {
    }
}
