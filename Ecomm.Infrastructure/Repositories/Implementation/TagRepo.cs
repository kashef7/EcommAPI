using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Domain.Entities.Tags;
using Ecomm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Repositories.Implementation;

public class TagRepo : ITagRepo
{
    private readonly AppDbContext _dbContext;

    public TagRepo(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Tag>> GetAllAsync()
    {
        return await _dbContext.Tags
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<Tag>> GetOrCreateTagsAsync(IEnumerable<string> tagNames)
    {
        var normalizedNames = tagNames
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        if (normalizedNames.Count == 0)
            return [];

        var existingTags = await _dbContext.Tags
            .Where(t => normalizedNames.Contains(t.Name))
            .ToListAsync();

        var existingNames = existingTags.Select(t => t.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var missingNames = normalizedNames.Where(n => !existingNames.Contains(n)).ToList();

        var result = new List<Tag>(existingTags);
        foreach (var name in missingNames)
        {
            var newTag = new Tag(name);
            await _dbContext.Tags.AddAsync(newTag);
            result.Add(newTag);
        }

        return result;
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
