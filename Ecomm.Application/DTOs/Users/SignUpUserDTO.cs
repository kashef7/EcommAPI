using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Users;

public record SignUpUserDTO()
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; }
    
    [Required]
    [MaxLength(320)]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [MaxLength(72)]
    [MinLength(8)]
    public string Password { get; set; }
};
