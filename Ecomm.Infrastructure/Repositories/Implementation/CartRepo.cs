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

    public async Task<Cart?> GetCartByUserIdAsync(Guid userId)
    {
        var cart = await _dbContext.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart is not null) return cart;

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new UserNotFoundException();

        cart = new Cart(user);
        _dbContext.Carts.Add(cart);
        await _dbContext.SaveChangesAsync();
        return cart;
    }

    public async Task<decimal> GetCartTotalPriceAsync(Guid cartId)
    {
        return await _dbContext.Carts
            .Where(c => c.Id == cartId)
            .SelectMany(c => c.Items)
            .Join(
                _dbContext.Products,
                item => item.ProductId,
                product => product.Id,
                (item, product) => item.Quantity * product.Price)
            .SumAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
