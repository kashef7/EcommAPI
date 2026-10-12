using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Auth;
[ApiController]
[Route("api/[controller]")]
public class AuthController:ControllerBase
{
    private readonly IUserSignUpUseCase _userSignUpUseCase;

    public AuthController(IUserSignUpUseCase userSignUpUseCase)
    {
        _userSignUpUseCase = userSignUpUseCase;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp(UserSignUpDTO user)
    {
        var result = await _userSignUpUseCase.ExecuteAsync(user);
        SetRefreshTokenCookie(result.refreshToken, result.refreshTokenExpiresAt);
        return Ok(result); //Will change to CreatedAtAction when adding the GetMe controller
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