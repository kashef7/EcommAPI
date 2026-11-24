namespace Ecomm.Application.Exceptions;

public class VariantNotFoundException : AppException
{
    public VariantNotFoundException(Guid? id = null)
        : base(id.HasValue ? $"Product variant {id} was not found." : "Product variant not found")
    {
    }
}
