using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record AddProductOptionValueDTO
{
    [Required]
    [MaxLength(100)]
    public string Value { get; set; } = string.Empty;
}
