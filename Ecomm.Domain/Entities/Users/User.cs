namespace Ecomm.Domain.Entities.Users;

public class User
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; }
    public string Email  { get; private set; }
    public string PasswordHash  { get; private set; }
    public bool IsAdmin { get; private set; } = false;
    public DateTime CreatedAt { get; init; }


    public User() { }
    
    public User(string name, string email, string passwordHash)
    {
        Name = name;
        Email = email;
        PasswordHash = passwordHash;
        CreatedAt = DateTime.UtcNow;
    }
    
    public void UpdateUserEmail(string newEmail)
    {
        Email = newEmail;
    }

    public void UpdateUserPasswordHash(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
    }
}