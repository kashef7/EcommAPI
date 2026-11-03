namespace Ecomm.Application.DTOs.Carts;

public record CartItemDTO(
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);
