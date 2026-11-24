using Ecomm.Application.DTOs.Tags;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Tags;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Tags;

public class GetAllTagsUseCase : IGetAllTagsUseCase
{
    private readonly ITagRepo _tagRepo;
    private readonly ILogger<GetAllTagsUseCase> _logger;

    public GetAllTagsUseCase(ITagRepo tagRepo, ILogger<GetAllTagsUseCase> logger)
    {
        _tagRepo = tagRepo;
        _logger = logger;
    }

    public async Task<IReadOnlyList<TagDTO>> ExecuteAsync()
    {
        var tags = await _tagRepo.GetAllAsync();
        return tags
            .Select(t => new TagDTO(t.Id, t.Name, t.CreatedAt))
            .ToList();
    }
}
