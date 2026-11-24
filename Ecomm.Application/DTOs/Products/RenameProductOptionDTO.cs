using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record RenameProductOptionDTO
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
}
