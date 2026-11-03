using Ecomm.Application.Exceptions;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Domain.Entities.Carts;
using Ecomm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Repositories.Implementation;

public class CartRepo : ICartRepo
{
    private readonly AppDbContext _dbContext;

    public CartRepo(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Cart> GetOrCreateCartAsync(Guid userId)
    {
        var cart = await _dbContext.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart is not null) return cart;

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new UserNotFoundException();

        cart = new Cart(user);
        _dbContext.Carts.Add(cart);
        await _dbContext.SaveChangesAsync();
        return cart;
    }

    public async Task RemoveProductFromAllCartsAsync(Guid productId)
    {
        await _dbContext.CartItems.Where(i => i.ProductId == productId).ExecuteDeleteAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
