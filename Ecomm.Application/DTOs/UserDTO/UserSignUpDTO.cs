using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.UserDTO;

public record UserSignUpDTO()
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; }
    
    [Required]
    [MaxLength(320)]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [MaxLength(500)]
    [MinLength(8)]
    public string Password { get; set; }
};