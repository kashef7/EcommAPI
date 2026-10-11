using Ecomm.Domain.Entities.Orders;
using Ecomm.Domain.Enums;
using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Payments;

public class Payment
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public Guid OrderId { get; init; }
    public Order Order { get; init; } = null!;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = null!;
    public PaymentStatus Status { get; private set; }
    public string Provider { get; init; } = null!;
    public string ProviderReference { get; init; } = null!;
    public DateTime CreatedAt { get; init; }
    public DateTime? PaidAt { get; private set; }
    
    private Payment() { }

    public Payment(Order order, string currency, string provider, string providerReference)
    {
        if (order.Total <= 0)
            throw new DomainException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency) || currency.Trim().Length != 3)
            throw new DomainException("Currency must be a 3-letter currency code.");
        if (string.IsNullOrWhiteSpace(provider))
            throw new DomainException("Payment provider cannot be empty.");
        if (string.IsNullOrWhiteSpace(providerReference))
            throw new DomainException("Payment provider reference cannot be empty.");

        OrderId = order.Id;
        Order = order;
        Amount = order.Total;
        Currency = currency.Trim().ToUpperInvariant();
        Provider = provider;
        ProviderReference = providerReference;
        Status = PaymentStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }
    
    public void MarkAsPaid()
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidStatusTransitionException("Payment", Status.ToString(), PaymentStatus.Paid.ToString());

        Status = PaymentStatus.Paid;
        PaidAt = DateTime.UtcNow;
    }

    public void MarkAsFailed()
    {
        if (Status != PaymentStatus.Pending)
            throw new InvalidStatusTransitionException("Payment", Status.ToString(), PaymentStatus.Failed.ToString());

        Status = PaymentStatus.Failed;
    }

    public void Refund()
    {
        if (Status != PaymentStatus.Paid)
            throw new InvalidStatusTransitionException("Payment", Status.ToString(), PaymentStatus.Refunded.ToString());

        Status = PaymentStatus.Refunded;
    }
}