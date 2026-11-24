using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Categories;

public record CreateCategoryDTO
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}
