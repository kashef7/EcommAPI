using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Tags;

public class Tag
{
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }

    private Tag() { }

    public Tag(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Tag name cannot be empty.");

        var trimmed = name.Trim().ToLowerInvariant();
        if (trimmed.Length is < 1 or > 50)
            throw new DomainException("Tag name must be between 1 and 50 characters.");

        Name = trimmed;
        CreatedAt = DateTime.UtcNow;
    }
}
