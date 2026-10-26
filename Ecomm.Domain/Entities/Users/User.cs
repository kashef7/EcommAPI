using Ecomm.Domain.Exceptions;
using Ecomm.Domain.ValueObjects;

namespace Ecomm.Domain.Entities.Users;

public class User
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public RefreshToken? RefreshToken { get; private set; }
    public bool IsAdmin { get; private set; } = false;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; private set; }

    private User() { }
    
    public User(string name, string email, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("User name cannot be empty.");
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("User email cannot be empty.");
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("User password hash cannot be empty.");

        Name = name;
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        
        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }
    
    public void UpdateEmail(string newEmail)
    {
        if (string.IsNullOrWhiteSpace(newEmail))
            throw new DomainException("User email cannot be empty.");

        Email = newEmail.Trim().ToLowerInvariant();
    }

    public void UpdatePasswordHash(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new DomainException("User password hash cannot be empty.");

        PasswordHash = newPasswordHash;
    }

    public void UpdateRefreshToken(string refreshToken,DateTime refreshTokenExpiresAt)
    {
        RefreshToken = new RefreshToken(refreshToken, refreshTokenExpiresAt);
    }

    public void RemoveRefreshToken()
    {
        RefreshToken = null;
    }
}
