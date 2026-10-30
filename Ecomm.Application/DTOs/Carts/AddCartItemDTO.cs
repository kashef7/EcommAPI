using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Carts;

public record AddCartItemDTO()
{
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    [Range(1, 1000000)]
    public int Quantity { get; set; }
};