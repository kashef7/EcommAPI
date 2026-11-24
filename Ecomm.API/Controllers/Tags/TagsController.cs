using Ecomm.Application.UseCases.Abstraction.Tags;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Tags;

[ApiController]
[Authorize]
[Route("api/tags")]
public class TagsController : ControllerBase
{
    private readonly IGetAllTagsUseCase _getAllTagsUseCase;

    public TagsController(IGetAllTagsUseCase getAllTagsUseCase)
    {
        _getAllTagsUseCase = getAllTagsUseCase;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetTags()
    {
        var tags = await _getAllTagsUseCase.ExecuteAsync();
        return Ok(tags);
    }
}
