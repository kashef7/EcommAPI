using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Products;

public class ProductOptionValue
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid OptionId { get; init; }
    public ProductOption Option { get; init; } = null!;
    public string Value { get; private set; } = null!;
    public int SortOrder { get; private set; }

    private ProductOptionValue() { }

    public ProductOptionValue(Guid optionId, string value, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Option value cannot be empty.");

        var trimmed = value.Trim();
        if (trimmed.Length > 100)
            throw new DomainException("Option value cannot exceed 100 characters.");

        OptionId = optionId;
        Value = trimmed;
        SortOrder = sortOrder;
    }

    public void Rename(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Option value cannot be empty.");

        var trimmed = value.Trim();
        if (trimmed.Length > 100)
            throw new DomainException("Option value cannot exceed 100 characters.");

        Value = trimmed;
    }
}
