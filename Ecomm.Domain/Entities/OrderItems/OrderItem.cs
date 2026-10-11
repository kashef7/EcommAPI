using Ecomm.Domain.Entities.Orders;
using Ecomm.Domain.Entities.Products;

namespace Ecomm.Domain.Entities.OrderItems;

public class OrderItem
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid OrderId { get; init; }
    public Order Order { get; init; } = null!;
    public Guid ProductId { get; init; }
    public Product Product { get; init; } = null!;
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; init; }
    
    private OrderItem() { }

    internal OrderItem(Order order, Product product, int quantity, decimal unitPrice)
    {
        OrderId = order.Id;
        Order = order;
        ProductId = product.Id;
        Product = product;
        Quantity = quantity;
        UnitPrice = unitPrice;
    }
    
    internal void IncreaseQuantity(int quantity)
    {
        Quantity += quantity;
    }
}