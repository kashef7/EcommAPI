using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record AddProductDTO
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public Guid CategoryId { get; set; }

    public string[]? Tags { get; set; }

    public string[]? ImageUrls { get; set; }

    public List<CreateProductOptionDTO>? Options { get; set; }

    [Required]
    public List<CreateProductVariantDTO> Variants { get; set; } = [];
}

public record CreateProductOptionDTO
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public List<string> Values { get; set; } = [];
}

public record CreateProductVariantDTO
{
    public Dictionary<string, string>? OptionValues { get; set; }

    [Required]
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal Price { get; set; }

    [Required]
    [Range(0, 1000000)]
    public int StockQuantity { get; set; }
}
