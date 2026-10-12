using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IUserRepo;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Users;
using Ecomm.Domain.Entities.Users;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UserSignUpUseCase:IUserSignUpUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    public UserSignUpUseCase(IUserRepo userRepo, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _userRepo = userRepo;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }
    public async Task<AuthUserDTO> ExecuteAsync(UserSignUpDTO user)
    {
        var normalizedEmail = user.Email.Trim().ToLowerInvariant();
        if (await _userRepo.GetUserByEmailAsync(normalizedEmail) != null)
        {
            throw new EmailAlreadyExistException(normalizedEmail);
        }

        var passwordHash = _passwordHasher.HashPassword(user.Password);
        
        var newUser = new User(user.Name, user.Email, passwordHash);
        
        await _userRepo.AddUserAsync(newUser);
        
        var (accessToken,expiresIn) = _tokenService.GenerateAccessToken(newUser);
        
        var (refreshTokenRaw,refreshTokenHash,refreshTokenExpiresAt) = _tokenService.GenerateRefreshToken(newUser);
        
        newUser.UpdateRefreshToken(refreshTokenHash,refreshTokenExpiresAt);
        await _userRepo.SaveChangesAsync();
        
        return new AuthUserDTO(newUser.Name, newUser.Email,refreshTokenRaw,accessToken,expiresIn,refreshTokenExpiresAt);
    }
}