using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Categories;

public class Category
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Category() { }

    public Category(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Category name cannot be empty.");

        Name = name.Trim();
        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Category name cannot be empty.");

        Name = name.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}
