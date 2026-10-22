namespace Ecomm.Application.DTOs.ProductDTO;

public record GetProductDTO(Guid Id,string Name,string Description,string? ImgUrl,string Tag,decimal Price,int Stock,DateTime CreatedAt);