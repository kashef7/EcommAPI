using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.ProductDTO;

public record AddProductDTO()
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal? Price { get; set; }
    
    [Required]
    [Range(0, 1000000)]
    public int? Stock { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Tag { get; set; } = string.Empty;
    
    [MaxLength(2048)]
    public string? ImgUrl { get; set; }
}
