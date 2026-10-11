using Ecomm.Domain.Entities.Users;
using Ecomm.Domain.Enums;

namespace Ecomm.Domain.Entities.Orders;

public class Order
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid UserId { get; init; }
    public User User { get; init; }
    public OrderStatus Status { get; private set; }
    public decimal Total { get; private set; }
    public string Address { get; private set; }
    public DateTime CreatedAt { get; init; }

    public Order() { }

    public Order(User user, OrderStatus status, decimal total, string address)
    {
        UserId = user.Id;
        User = user;
        Status = status;
        Total = total;
        Address = address;
        CreatedAt = DateTime.UtcNow;
    }
    public void UpdateAddress(string address)
    {
        Address = address;
    }
    public void UpdateStatus(OrderStatus status)
    {
        Status = status;
    }

    public void UpdateTotal(decimal total)
    {
        Total = total;
    }
}