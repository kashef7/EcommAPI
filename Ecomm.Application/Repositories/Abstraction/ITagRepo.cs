using Ecomm.Domain.Entities.Tags;

namespace Ecomm.Application.Repositories.Abstraction;

public interface ITagRepo
{
    Task<IReadOnlyList<Tag>> GetAllAsync();
    Task<IReadOnlyList<Tag>> GetOrCreateTagsAsync(IEnumerable<string> tagNames);
    Task SaveChangesAsync();
}
