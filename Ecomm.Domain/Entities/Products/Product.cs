using Ecomm.Domain.Entities.Categories;
using Ecomm.Domain.Entities.Tags;
using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Products;

public class Product
{
    public const int MaxStockQuantity = 1_000_000;
    public const int MaxImagesCount = 10;
    public const int MaxTagsCount = 20;

    private readonly List<ProductImage> _images = [];
    private readonly List<ProductTags> _productTags = [];

    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public Guid CategoryId { get; private set; }
    public Category Category { get; private set; } = null!;

    // Temporarily retained on Product during Phase 1 for Cart/Order compatibility;
    // will be migrated to ProductVariant in Phase 2.
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }

    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    public IReadOnlyCollection<ProductImage> Images => _images.AsReadOnly();
    public IReadOnlyCollection<ProductTags> ProductTags => _productTags.AsReadOnly();

    private Product() { }

    public Product(string name, string description, Guid categoryId, decimal price = 0, int stockQuantity = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Product name cannot be empty.");
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Product description cannot be empty.");
        if (categoryId == Guid.Empty)
            throw new DomainException("Product category cannot be empty.");

        Name = name.Trim();
        Description = description.Trim();
        CategoryId = categoryId;
        Price = price;
        StockQuantity = stockQuantity;

        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Product name cannot be empty.");

        Name = name.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Product description cannot be empty.");

        Description = description.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateCategory(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            throw new DomainException("Product category cannot be empty.");

        CategoryId = categoryId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetImages(IEnumerable<string> imageUrls)
    {
        var urls = imageUrls?.ToList() ?? [];
        if (urls.Count > MaxImagesCount)
            throw new DomainException($"Product cannot have more than {MaxImagesCount} images.");

        _images.Clear();
        for (var i = 0; i < urls.Count; i++)
        {
            var url = urls[i];
            if (string.IsNullOrWhiteSpace(url))
                throw new DomainException("Product image URL cannot be empty.");

            _images.Add(new ProductImage(Id, url.Trim(), i));
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void SetTags(IEnumerable<Tag> tags)
    {
        var tagList = tags?
            .GroupBy(t => t.Id)
            .Select(g => g.First())
            .ToList() ?? [];

        if (tagList.Count > MaxTagsCount)
            throw new DomainException($"Product cannot have more than {MaxTagsCount} tags.");

        _productTags.Clear();
        foreach (var tag in tagList)
        {
            _productTags.Add(new ProductTags(Id, tag.Id) { Tag = tag });
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        if (DeletedAt != null)
            throw new DomainException("Product is already deleted.");

        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    // Transitional properties for Phase 1 compilation; not mapped in EF Core
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string Tag => _productTags.FirstOrDefault()?.Tag?.Name ?? string.Empty;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string? ImageUrl => _images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url;

    public Product(string name, string description, decimal price, int stockQuantity, string tag, string? imageUrl = null)
        : this(name, description, Guid.Empty, price, stockQuantity)
    {
    }

    public void UpdateTag(string tag)
    {
    }

    public void UpdateImageUrl(string? imageUrl)
    {
    }
    public void UpdatePrice(decimal price)
    {
        if (price <= 0)
            throw new DomainException("Product price must be greater than zero.");

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

        StockQuantity += quantity;
        UpdatedAt = DateTime.UtcNow;
    }
}
