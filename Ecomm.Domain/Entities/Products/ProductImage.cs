using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Products;

public class ProductImage
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid ProductId { get; init; }
    public Product Product { get; init; } = null!;
    public string Url { get; private set; } = null!;
    public int SortOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private ProductImage() { }

    public ProductImage(Guid productId, string url, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new DomainException("Product image URL cannot be empty.");

        ProductId = productId;
        Url = url.Trim();
        SortOrder = sortOrder;
        CreatedAt = DateTime.UtcNow;
    }
}
