using Ecomm.Domain.Entities.Orders;
using Ecomm.Domain.Entities.Products;

namespace Ecomm.Domain.Entities.OrderItems;

public class OrderItem
{
    public Guid OrderId { get; init; }
    public Order Order { get; init; }
    public Guid ProductId { get; init; }
    public Product Product { get; init; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    
    public OrderItem(){}

    public OrderItem(Order order, Product product, int quantity, decimal unitPrice)
    {
        Order = order;
        Product = product;
        Quantity = quantity;
        UnitPrice = unitPrice;
    }
    
    public void UpdateQuantity(int quantity)
    {
        Quantity = quantity;
    }
    public void UpdateUnitPrice(decimal unitPrice)
    {
        UnitPrice = unitPrice;
    }
}