using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.UserDTO;

public record UpdateEmailDTO()
{
    private string? _email;

    [Required]
    [MaxLength(320)]
    [EmailAddress]
    public string Email
    {
        get => _email ?? string.Empty;
        set => _email = value;
    }

    public string? NewEmail
    {
        get => _email;
        set => _email = value;
    }
};

public record UserUpdateEmailDTO : UpdateEmailDTO;
