namespace Ecomm.Application.DTOs.Products;

public record GetProductDTO(
    Guid Id,
    string Name,
    string CategoryName,
    string? PrimaryImageUrl,
    decimal MinPrice,
    bool InStock,
    IReadOnlyList<string> Tags);
