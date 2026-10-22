using System.Security.Claims;
using Ecomm.API.Controllers.Users;
using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Auth;
[ApiController]
[Route("api/[controller]")]
public class AuthController:ControllerBase
{
    private readonly IUserSignUpUseCase _userSignUpUseCase;
    private readonly IUserLoginUseCase _userLoginUseCase;
    private readonly IUserLogoutUseCase _userLogoutUseCase;
    private readonly IUserRefreshTokenUseCase _userRefreshTokenUseCase;
    public AuthController(IUserSignUpUseCase userSignUpUseCase , IUserLoginUseCase userLoginUseCase, IUserLogoutUseCase userLogoutUseCase, IUserRefreshTokenUseCase userRefreshTokenUseCase)
    {
        _userSignUpUseCase = userSignUpUseCase;
        _userLoginUseCase = userLoginUseCase;
        _userLogoutUseCase = userLogoutUseCase;
        _userRefreshTokenUseCase = userRefreshTokenUseCase;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp(UserSignUpDTO user)
    {
        var result = await _userSignUpUseCase.ExecuteAsync(user);
        SetRefreshTokenCookie(result.refreshToken, result.refreshTokenExpiresAt);
        //Should remove the refreshToken from the result
        return Ok(result); //Will change to CreatedAtAction when adding the GetMe controller
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login(UserLoginDTO user)
    {
        var result = await _userLoginUseCase.ExecuteAsync(user);
        SetRefreshTokenCookie(result.refreshToken, result.refreshTokenExpiresAt);
        //Should remove the refreshToken from the result
        return CreatedAtAction(
            actionName: nameof(UserController.GetMe),
            controllerName: "User",
            routeValues: null,
            value: result
        );
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }
        
        await _userLogoutUseCase.ExecuteAsync(userId);
        Response.Cookies.Delete("refreshToken");

        return NoContent();
    }

    [HttpPost("refreshToken")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        var result = await _userRefreshTokenUseCase.ExecuteAsync(refreshToken);
        SetRefreshTokenCookie(result.refreshToken, result.refreshTokenExpiresAt);
        //Should remove the refreshToken from the result
        return Ok(result);
    }
    
    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Expires = expiresAt
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}