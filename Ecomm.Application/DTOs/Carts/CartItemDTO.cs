namespace Ecomm.Application.DTOs.Carts;

public record CartItemDTO(
    Guid VariantId,
    Guid ProductId,
    string ProductName,
    string VariantLabel,
    string? ImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);
