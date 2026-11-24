using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record UpdateVariantPriceDTO
{
    [Required]
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal Price { get; set; }
}
