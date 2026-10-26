namespace Ecomm.Application.DTOs.Products;

public record GetProductDTO(Guid Id, string Name, string Description, string? ImgUrl, string Tag, decimal Price, int Stock, DateTime CreatedAt);
