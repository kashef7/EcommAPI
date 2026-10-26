using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.ProductDTO;

public record UpdateProductDTO()
{
    [MaxLength(200)]
    public string? Name { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Description { get; set; } = string.Empty;
    
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal? Price { get; set; }
    
    [Range(0, 1000000)]
    public int? Stock { get; set; }
    
    [MaxLength(100)]
    public string? Tag { get; set; } = string.Empty;
    
    [MaxLength(2048)]
    public string? ImgUrl { get; set; }
}