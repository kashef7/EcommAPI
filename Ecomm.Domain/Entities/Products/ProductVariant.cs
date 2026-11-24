using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Products;

public class ProductVariant
{
    public const int MaxStockQuantity = 1_000_000;

    private readonly List<VariantOptionValue> _optionValues = [];

    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid ProductId { get; init; }
    public Product Product { get; init; } = null!;
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }

    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    public IReadOnlyCollection<VariantOptionValue> OptionValues => _optionValues.AsReadOnly();

    private ProductVariant() { }

    public ProductVariant(Guid productId, decimal price, int stockQuantity)
    {
        if (price <= 0)
            throw new DomainException("Variant price must be greater than zero.");
        if (stockQuantity < 0)
            throw new DomainException("Variant stock quantity cannot be negative.");
        if (stockQuantity > MaxStockQuantity)
            throw new DomainException($"Variant stock quantity cannot exceed {MaxStockQuantity}.");

        ProductId = productId;
        Price = price;
        StockQuantity = stockQuantity;

        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public void UpdatePrice(decimal price)
    {
        if (price <= 0)
            throw new DomainException("Variant price must be greater than zero.");

        Price = price;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DecreaseStock(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity to decrease must be greater than zero.");

        if (quantity > StockQuantity)
            throw new InsufficientStockException(Id, quantity, StockQuantity);

        StockQuantity -= quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncreaseStock(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity to increase must be greater than zero.");

        if (StockQuantity + quantity > MaxStockQuantity)
            throw new DomainException($"Stock cannot exceed {MaxStockQuantity}.");

        StockQuantity += quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddOptionValue(Guid optionValueId)
    {
        _optionValues.Add(new VariantOptionValue(Id, optionValueId));
    }

    public void Delete()
    {
        if (DeletedAt != null)
            throw new DomainException("Variant is already deleted.");

        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
