using Ecomm.Domain.Entities.Orders;
using Ecomm.Domain.Entities.Products;

namespace Ecomm.Domain.Entities.OrderItems;

public class OrderItem
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid OrderId { get; init; }
    public Order Order { get; init; } = null!;
    public Guid VariantId { get; init; }
    public ProductVariant Variant { get; init; } = null!;
    public string ProductName { get; init; } = null!;
    public string VariantLabel { get; init; } = null!;
    public string? ImageUrl { get; init; }
    public decimal UnitPrice { get; init; }
    public int Quantity { get; private set; }
    
    private OrderItem() { }

    internal OrderItem(
        Order order,
        ProductVariant variant,
        int quantity,
        string productName,
        string variantLabel,
        string? imageUrl,
        decimal unitPrice)
    {
        OrderId = order.Id;
        Order = order;
        VariantId = variant.Id;
        Variant = variant;
        Quantity = quantity;
        ProductName = productName;
        VariantLabel = variantLabel;
        ImageUrl = imageUrl;
        UnitPrice = unitPrice;
    }
    
    internal void IncreaseQuantity(int quantity)
    {
        Quantity += quantity;
    }
}
