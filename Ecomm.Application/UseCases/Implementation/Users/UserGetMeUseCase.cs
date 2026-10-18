using Ecomm.Application.DTOs.UserDTO;
using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction.IUserRepo;
using Ecomm.Application.UseCases.Abstraction.Users;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Users;

public class UserGetMeUseCase : IUserGetMeUseCase
{
    private readonly IUserRepo _userRepo;
    private readonly ILogger<UserGetMeUseCase> _logger;

    public UserGetMeUseCase(IUserRepo userRepo, ILogger<UserGetMeUseCase> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }
    public async Task<GetMeUserDTO> ExecuteAsync(Guid id)
    {
        var user = await _userRepo.GetUserByIdAsync(id);
        if (user == null)
        {
            throw new UserNotFoundException();
        }
        return new GetMeUserDTO(user.Name, user.Email);
    }
}