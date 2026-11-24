namespace Ecomm.Application.Exceptions;

public class CategoryNotFoundException : AppException
{
    public CategoryNotFoundException(Guid? id = null)
        : base(id.HasValue ? $"Category {id} was not found." : "Category not found")
    {
    }
}
