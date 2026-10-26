using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Users;

public record LoginUserDTO()
{
    [Required]
    [MaxLength(320)]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [MaxLength(72)]
    [MinLength(8)]
    public string Password { get; set; }
};
