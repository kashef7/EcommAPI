using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record UpdateProductDTO
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public Guid? CategoryId { get; set; }

    public string[]? Tags { get; set; }

    public string[]? ImageUrls { get; set; }
}
