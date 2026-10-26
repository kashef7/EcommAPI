using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.ProductDTO;

public record UpdateProductDTO()
{
    [MaxLength(200)]
    public string? Name { get; set; }
    
    [MaxLength(2000)]
    public string? Description { get; set; }
    
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal? Price { get; set; }
    
    [MaxLength(100)]
    public string? Tag { get; set; }
    
    [MaxLength(2048)]
    public string? ImgUrl { get; set; }
}
