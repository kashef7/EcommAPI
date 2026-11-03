using Ecomm.API.Extensions;
using Ecomm.Application.DTOs.Users;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Users;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IGetCurrentUserUseCase _getCurrentUserUseCase;
    private readonly IUpdateUserEmailUseCase _updateUserEmailUseCase;
    private readonly IUpdateUserPasswordUseCase _updateUserPasswordUseCase;

    public UsersController(
        IGetCurrentUserUseCase getCurrentUserUseCase,
        IUpdateUserEmailUseCase updateUserEmailUseCase,
        IUpdateUserPasswordUseCase updateUserPasswordUseCase)
    {
        _getCurrentUserUseCase = getCurrentUserUseCase;
        _updateUserEmailUseCase = updateUserEmailUseCase;
        _updateUserPasswordUseCase = updateUserPasswordUseCase;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }
        var user = await _getCurrentUserUseCase.ExecuteAsync(userId);
        return Ok(user);
    }

    [Authorize]
    [HttpPatch("updateEmail")]
    [HttpPut("updateEmail")]
    public async Task<IActionResult> UpdateEmail(UpdateUserEmailDTO user)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }
        await _updateUserEmailUseCase.ExecuteAsync(userId, user);
        return NoContent();
    }

    [Authorize]
    [HttpPatch("updatePassword")]
    [HttpPut("updatePassword")]
    public async Task<IActionResult> UpdatePassword(UpdateUserPasswordDTO user)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }
        await _updateUserPasswordUseCase.ExecuteAsync(userId, user);
        return NoContent();
    }
}
