using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.UserDTO;

public record UpdatePasswordDTO()
{
    private string? _oldPassword;
    private string? _newPassword;

    [Required]
    public string OldPassword
    {
        get => _oldPassword ?? string.Empty;
        set => _oldPassword = value;
    }

    public string? CurrentPassword
    {
        get => _oldPassword;
        set => _oldPassword = value;
    }

    [Required]
    [MaxLength(72)]
    [MinLength(8)]
    public string NewPassword
    {
        get => _newPassword ?? string.Empty;
        set => _newPassword = value;
    }

    public string? Password
    {
        get => _newPassword;
        set => _newPassword = value;
    }
};

public record UserUpdatePasswordDTO : UpdatePasswordDTO;
