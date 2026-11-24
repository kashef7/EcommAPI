using Ecomm.Domain.Entities.Tags;

namespace Ecomm.Domain.Entities.Products;

public class ProductTags
{
    public Guid ProductId { get; init; }
    public Product Product { get; init; } = null!;
    public Guid TagId { get; init; }
    public Tag Tag { get; init; } = null!;
    public DateTime CreatedAt { get; init; }

    private ProductTags() { }

    public ProductTags(Guid productId, Guid tagId)
    {
        ProductId = productId;
        TagId = tagId;
        CreatedAt = DateTime.UtcNow;
    }
}
