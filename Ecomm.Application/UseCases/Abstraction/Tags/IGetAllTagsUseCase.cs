using Ecomm.Application.DTOs.Tags;

namespace Ecomm.Application.UseCases.Abstraction.Tags;

public interface IGetAllTagsUseCase
{
    Task<IReadOnlyList<TagDTO>> ExecuteAsync();
}
