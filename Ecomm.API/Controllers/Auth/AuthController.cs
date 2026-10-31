using System.Security.Claims;
using Ecomm.API.Controllers.Users;
using Ecomm.Application.DTOs.Users;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ISignUpUserUseCase _signUpUserUseCase;
    private readonly ILoginUserUseCase _loginUserUseCase;
    private readonly ILogoutUserUseCase _logoutUserUseCase;
    private readonly IRefreshUserTokenUseCase _refreshUserTokenUseCase;

    public AuthController(
        ISignUpUserUseCase signUpUserUseCase,
        ILoginUserUseCase loginUserUseCase,
        ILogoutUserUseCase logoutUserUseCase,
        IRefreshUserTokenUseCase refreshUserTokenUseCase)
    {
        _signUpUserUseCase = signUpUserUseCase;
        _loginUserUseCase = loginUserUseCase;
        _logoutUserUseCase = logoutUserUseCase;
        _refreshUserTokenUseCase = refreshUserTokenUseCase;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp(SignUpUserDTO user)
    {
        var result = await _signUpUserUseCase.ExecuteAsync(user);
        SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
        //Should remove the refreshToken from the result
        return CreatedAtAction(
            actionName: nameof(UsersController.GetMe),
            controllerName: "Users",
            routeValues: null,
            value: result
        );
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginUserDTO user)
    {
        var result = await _loginUserUseCase.ExecuteAsync(user);
        SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
        //Should remove the refreshToken from the result
        return Ok(result);
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
        
        await _logoutUserUseCase.ExecuteAsync(userId);
        Response.Cookies.Delete("refreshToken");

        return NoContent();
    }

    [HttpPost("refreshToken")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized();
        }
        var result = await _refreshUserTokenUseCase.ExecuteAsync(refreshToken);
        SetRefreshTokenCookie(result.RefreshToken, result.RefreshTokenExpiresAt);
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
