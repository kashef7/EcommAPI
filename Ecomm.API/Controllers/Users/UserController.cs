using System.Security.Claims;
using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Users;

[ApiController]
[Route("api/[controller]")]
public class UserController:ControllerBase
{
    private readonly IUserGetMeUseCase _userGetMeUseCase;
    private readonly IUserUpdateEmailUseCase _userUpdateEmailUseCase;
    private readonly IUserUpdatePasswordUseCase _userUpdatePasswordUseCase;

    public UserController(
        IUserGetMeUseCase userGetMeCase,
        IUserUpdateEmailUseCase userUpdateEmailUseCase,
        IUserUpdatePasswordUseCase userUpdatePasswordUseCase)
    {
        _userGetMeUseCase = userGetMeCase;
        _userUpdateEmailUseCase = userUpdateEmailUseCase;
        _userUpdatePasswordUseCase = userUpdatePasswordUseCase;
    }

    [Authorize]
    [HttpGet("/me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }
        var user = await _userGetMeUseCase.ExecuteAsync(userId);
        return Ok(user);
    }

    [Authorize]
    [HttpPatch("/updateEmail")]
    [HttpPut("/updateEmail")]
    public async Task<IActionResult> UpdateEmail(UpdateEmailDTO user)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }
        await _userUpdateEmailUseCase.ExecuteAsync(userId, user);
        return NoContent();
    }

    [Authorize]
    [HttpPatch("/updatePassword")]
    [HttpPut("/updatePassword")]
    public async Task<IActionResult> UpdatePassword(UpdatePasswordDTO user)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }
        await _userUpdatePasswordUseCase.ExecuteAsync(userId, user);
        return NoContent();
    }
}