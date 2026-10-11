namespace Ecomm.Domain.Entities.Products;

public class Product
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; }
    public string Description { get; private set; }
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }
    public string Tag { get; private set; }
    public string? ImageUrl { get; private set; }
    
    public DateTime CreatedAt { get; init; }

    public Product() { }

    public Product(string name, string description, decimal price, int stockQuantity, string tag , string imageUrl = "")
    {
        Name = name;
        Description = description;
        Price = price;
        StockQuantity = stockQuantity;
        Tag = tag;
        ImageUrl = imageUrl;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateStockQuantity(int quantity)
    {
        StockQuantity = quantity;
    }
    public void UpdateTag(string tag)
    {
        Tag = tag;
    }
    public void UpdateImageUrl(string imageUrl)
    {
        ImageUrl = imageUrl;
    }
    public void UpdateName(string name)
    {
        Name = name;
    }

    public void UpdateDescription(string description)
    {
        Description = description;
    }

    public void UpdatePrice(decimal price)
    {
        Price = price;
    }
}