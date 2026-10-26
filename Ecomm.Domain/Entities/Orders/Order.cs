using Ecomm.Domain.Entities.OrderItems;
using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Entities.Users;
using Ecomm.Domain.Enums;
using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Orders;

public class Order
{
    private readonly List<OrderItem> _items = [];

    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid UserId { get; init; }
    public User User { get; init; } = null!;
    public OrderStatus Status { get; private set; }
    public decimal Total { get; private set; }
    public string Address { get; private set; } = null!;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; private set; }

    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { }

    public Order(User user, string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            throw new DomainException("Order address cannot be empty.");

        UserId = user.Id;
        User = user;
        Status = OrderStatus.Placed;
        Total = 0;
        Address = address;
        
        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public void AddItem(Product product, int quantity)
    {
        if (Status != OrderStatus.Placed)
            throw new DomainException("Items can only be added to an order while in Placed status.");

        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.");

        product.DecreaseStock(quantity);

        var existingItem = _items.FirstOrDefault(i => i.ProductId == product.Id);
        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            _items.Add(new OrderItem(this, product, quantity, product.Price));
        }

        RecalculateTotal();
    }

    public void UpdateAddress(string address)
    {
        if (Status != OrderStatus.Placed)
            throw new DomainException("Order address can only be updated while in Placed status.");

        if (string.IsNullOrWhiteSpace(address))
            throw new DomainException("Order address cannot be empty.");

        Address = address;
    }

    /// <summary>
    /// Changes the order status according to permitted state transitions.
    /// Items and their associated Products must be loaded when transitioning to Rejected or Cancelled to restore stock.
    /// </summary>
    public void ChangeStatus(OrderStatus newStatus)
    {
        var isValid = Status switch
        {
            OrderStatus.Placed => newStatus is OrderStatus.Approved or OrderStatus.Rejected or OrderStatus.Cancelled,
            OrderStatus.Approved => newStatus is OrderStatus.InProgress or OrderStatus.Cancelled,
            OrderStatus.InProgress => newStatus is OrderStatus.Delivered,
            _ => false
        };

        if (!isValid)
            throw new InvalidStatusTransitionException("Order", Status.ToString(), newStatus.ToString());

        if (newStatus is OrderStatus.Rejected or OrderStatus.Cancelled)
        {
            foreach (var item in _items)
            {
                item.Product.IncreaseStock(item.Quantity);
            }
        }

        Status = newStatus;
    }

    private void RecalculateTotal()
    {
        Total = _items.Sum(i => i.Quantity * i.UnitPrice);
    }
}
