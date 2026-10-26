using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Users;

public record UpdateUserPasswordDTO()
{
    [Required]
    public string OldPassword { get; set; }

    [Required]
    [MaxLength(72)]
    [MinLength(8)]
    public string NewPassword { get; set; }
};
