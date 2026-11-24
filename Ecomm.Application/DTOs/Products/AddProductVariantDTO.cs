using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record AddProductVariantDTO
{
    public Dictionary<string, string>? OptionValues { get; set; }

    [Required]
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal Price { get; set; }

    [Required]
    [Range(0, 1000000)]
    public int StockQuantity { get; set; }
}
