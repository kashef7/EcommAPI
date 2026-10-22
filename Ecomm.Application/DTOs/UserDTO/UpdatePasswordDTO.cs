using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.UserDTO;

public record UpdatePasswordDTO()
{


    [Required]
    public string OldPassword {get; set;}

    [Required]
    [MaxLength(72)]
    [MinLength(8)]
    public string NewPassword {get; set;}
};
