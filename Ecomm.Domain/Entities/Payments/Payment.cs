using Ecomm.Domain.Entities.Orders;

namespace Ecomm.Domain.Entities.Payments;

public class Payment
{
    public Guid Id { get; init; } =  Guid.CreateVersion7();
    public Guid OrderId { get; init; }
    public Order Order { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; }
    public string Status { get; private set; }
    public string Provider { get; init; }
    public string ProviderReference { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? PaidAt { get; private set; }
    
    public Payment(){}

    public Payment(Order order, decimal amount, string currency, string status, string provider,
        string providerReference)
    {
        Order = order;
        Amount = amount;
        Currency = currency;
        Status = status;
        Provider = provider;
        ProviderReference = providerReference;
        CreatedAt = DateTime.UtcNow;
    }
    
    public void UpdateStatus(string status)
    {
        Status = status;
    }

    public void PayPayment()
    {
        PaidAt =  DateTime.UtcNow;
    }
    
}