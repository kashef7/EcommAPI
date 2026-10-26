using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Products;

public class Product
{
    public const int MaxStockQuantity = 1_000_000;

    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }
    public string Tag { get; private set; } = null!;
    public string? ImageUrl { get; private set; }
    
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    private Product() { }

    public Product(string name, string description, decimal price, int stockQuantity, string tag, string? imageUrl = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Product name cannot be empty.");
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Product description cannot be empty.");
        if (price <= 0)
            throw new DomainException("Product price must be greater than zero.");
        if (stockQuantity < 0)
            throw new DomainException("Product stock quantity cannot be negative.");
        if (string.IsNullOrWhiteSpace(tag))
            throw new DomainException("Product tag cannot be empty.");

        Name = name;
        Description = description;
        Price = price;
        StockQuantity = stockQuantity;
        Tag = tag;
        ImageUrl = imageUrl;
        
        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Product name cannot be empty.");

        Name = name;
    }

    public void UpdateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Product description cannot be empty.");

        Description = description;
    }

    public void UpdatePrice(decimal price)
    {
        if (price <= 0)
            throw new DomainException("Product price must be greater than zero.");

        Price = price;
    }

    public void DecreaseStock(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity to decrease must be greater than zero.");

        if (quantity > StockQuantity)
            throw new InsufficientStockException(Id, quantity, StockQuantity);

        StockQuantity -= quantity;
    }

    public void IncreaseStock(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity to increase must be greater than zero.");

        StockQuantity += quantity;
    }

    public void UpdateTag(string tag)
    {
        if (string.IsNullOrWhiteSpace(tag))
            throw new DomainException("Product tag cannot be empty.");

        Tag = tag;
    }

    public void UpdateImageUrl(string? imageUrl)
    {
        ImageUrl = imageUrl;
    }

    public void Delete()
    {
        if (DeletedAt != null)
            throw new DomainException("Product is already deleted.");

        DeletedAt = DateTime.UtcNow;
    }
}
