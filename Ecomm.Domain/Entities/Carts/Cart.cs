
using Ecomm.Domain.Entities.Users;

namespace Ecomm.Domain.Entities.Carts;

public class Cart
{
    public Guid Id { get; private set; } = Guid.CreateVersion7();
    
    public Guid UserId { get; init; }
    public User User { get; init; }
    
    public Cart()
    {}
    public Cart(User user)
    {
        UserId = user.Id;
        User = user;
    }
}