using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Users;

public class User
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public bool IsAdmin { get; private set; } = false;
    public DateTime CreatedAt { get; init; }

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
        CreatedAt = DateTime.UtcNow;
    }
    
    public void UpdateUserEmail(string newEmail)
    {
        if (string.IsNullOrWhiteSpace(newEmail))
            throw new DomainException("User email cannot be empty.");

        Email = newEmail.Trim().ToLowerInvariant();
    }

    public void UpdateUserPasswordHash(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new DomainException("User password hash cannot be empty.");

        PasswordHash = newPasswordHash;
    }
}