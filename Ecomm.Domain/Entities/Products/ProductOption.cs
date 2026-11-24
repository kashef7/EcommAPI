using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Products;

public class ProductOption
{
    private readonly List<ProductOptionValue> _values = [];

    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid ProductId { get; init; }
    public Product Product { get; init; } = null!;
    public string Name { get; private set; } = null!;
    public int SortOrder { get; private set; }

    public IReadOnlyCollection<ProductOptionValue> Values => _values.AsReadOnly();

    private ProductOption() { }

    public ProductOption(Guid productId, string name, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Option name cannot be empty.");

        var trimmed = name.Trim();
        if (trimmed.Length > 50)
            throw new DomainException("Option name cannot exceed 50 characters.");

        ProductId = productId;
        Name = trimmed;
        SortOrder = sortOrder;
    }

    public void AddValue(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Option value cannot be empty.");

        var trimmed = value.Trim();
        if (trimmed.Length > 100)
            throw new DomainException("Option value cannot exceed 100 characters.");

        if (_values.Any(v => v.Value.Equals(trimmed, StringComparison.OrdinalIgnoreCase)))
            throw new DomainException($"Option value '{trimmed}' already exists for option '{Name}'.");

        _values.Add(new ProductOptionValue(Id, trimmed));
    }
}
