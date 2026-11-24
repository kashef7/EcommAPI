using Ecomm.Application.DTOs.Carts;
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
            .ThenInclude(i => i.Variant)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart is not null) return cart;

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new UserNotFoundException();

        cart = new Cart(user);
        _dbContext.Carts.Add(cart);
        await _dbContext.SaveChangesAsync();
        return cart;
    }

    public async Task<GetCartItemsDTO> GetCartDisplayAsync(Guid userId)
    {
        var cart = await _dbContext.Carts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            return new GetCartItemsDTO([], 0m);
        }

        var items = await _dbContext.CartItems
            .AsNoTracking()
            .Where(i => i.CartId == cart.Id)
            .Select(i => new
            {
                i.VariantId,
                ProductId = i.Variant.ProductId,
                ProductName = i.Variant.Product.Name,
                ImageUrl = i.Variant.Product.Images.OrderBy(img => img.SortOrder).Select(img => img.Url).FirstOrDefault(),
                UnitPrice = i.Variant.Price,
                i.Quantity,
                OptionValues = i.Variant.OptionValues
                    .OrderBy(ov => ov.OptionValue.Option.SortOrder)
                    .ThenBy(ov => ov.OptionValue.SortOrder)
                    .Select(ov => new { OptionName = ov.OptionValue.Option.Name, OptionVal = ov.OptionValue.Value })
                    .ToList()
            })
            .ToListAsync();

        var dtoList = items.Select(i =>
        {
            var variantLabel = i.OptionValues.Count > 0
                ? string.Join(", ", i.OptionValues.Select(ov => $"{ov.OptionName}: {ov.OptionVal}"))
                : string.Empty;
            var lineTotal = i.UnitPrice * i.Quantity;
            return new CartItemDTO(
                i.VariantId,
                i.ProductId,
                i.ProductName,
                variantLabel,
                i.ImageUrl,
                i.UnitPrice,
                i.Quantity,
                lineTotal);
        }).ToList();

        var total = dtoList.Sum(i => i.LineTotal);
        return new GetCartItemsDTO(dtoList, total);
    }

    public async Task RemoveProductFromAllCartsAsync(Guid productId)
    {
        await _dbContext.CartItems
            .Where(i => i.Variant.ProductId == productId)
            .ExecuteDeleteAsync();
    }

    public async Task RemoveVariantFromAllCartsAsync(Guid variantId)
    {
        await _dbContext.CartItems
            .IgnoreQueryFilters()
            .Where(i => i.VariantId == variantId)
            .ExecuteDeleteAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
