using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record AddProductOptionDTO
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public List<string> Values { get; set; } = [];

    public string? ExistingVariantsValue { get; set; }
}
