namespace Ecomm.Domain.ValueObjects;

public record RefreshToken
{
    public string TokenHash { get; init; } = null!;
    public DateTime ExpiresAt { get; init; }
    
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    
    private RefreshToken() { }

    public RefreshToken(string tokenHash, DateTime expiresAt)
    {
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
    }
    
    
}