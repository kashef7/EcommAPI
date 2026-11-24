namespace Ecomm.Application.Exceptions;

public class CategoryHasProductsException : AppException
{
    public CategoryHasProductsException(Guid id)
        : base($"Category {id} cannot be deleted because it still has associated products.")
    {
    }
}
