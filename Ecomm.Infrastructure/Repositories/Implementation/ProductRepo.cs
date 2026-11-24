using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Queries.Products;
using Ecomm.Infrastructure.Filters.Products;
using Ecomm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Repositories.Implementation;

public class ProductRepo : IProductRepo
{
    private readonly AppDbContext _dbContext;

    public ProductRepo(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<(IReadOnlyList<GetProductDTO> items, int totalCount)> GetAllAsync(ProductQuery productQuery)
    {
        var query = _dbContext.Products
            .AsNoTracking()
            .ApplyQueryFilters(productQuery);

        int totalCount = await query.CountAsync();

        IQueryable<Product> orderedQuery;
        if (string.Equals(productQuery.OrderBy, "price", StringComparison.OrdinalIgnoreCase))
        {
            orderedQuery = productQuery.OrderDesc
                ? query.OrderByDescending(p => p.Variants.Any(v => v.StockQuantity > 0)
                    ? p.Variants.Where(v => v.StockQuantity > 0).Min(v => (decimal?)v.Price) ?? 0m
                    : p.Variants.Min(v => (decimal?)v.Price) ?? 0m).ThenBy(p => p.Id)
                : query.OrderBy(p => p.Variants.Any(v => v.StockQuantity > 0)
                    ? p.Variants.Where(v => v.StockQuantity > 0).Min(v => (decimal?)v.Price) ?? 0m
                    : p.Variants.Min(v => (decimal?)v.Price) ?? 0m).ThenBy(p => p.Id);
        }
        else
        {
            orderedQuery = productQuery.OrderDesc
                ? query.OrderByDescending(p => p.CreatedAt).ThenBy(p => p.Id)
                : query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id);
        }

        var pagedQuery = orderedQuery
            .Skip((productQuery.PageNumber - 1) * productQuery.PageSize)
            .Take(productQuery.PageSize);

        var items = await pagedQuery
            .Select(p => new GetProductDTO(
                p.Id,
                p.Name,
                p.Category.Name,
                p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                p.Variants.Any(v => v.StockQuantity > 0)
                    ? p.Variants.Where(v => v.StockQuantity > 0).Min(v => (decimal?)v.Price) ?? 0m
                    : p.Variants.Min(v => (decimal?)v.Price) ?? 0m,
                p.Variants.Any(v => v.StockQuantity > 0),
                p.ProductTags.Select(pt => pt.Tag.Name).ToList()
            ))
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Product?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbContext.Products
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.ProductTags).ThenInclude(pt => pt.Tag)
            .Include(p => p.Options).ThenInclude(o => o.Values)
            .Include(p => p.Variants).ThenInclude(v => v.OptionValues).ThenInclude(ov => ov.OptionValue).ThenInclude(ov => ov.Option)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetByIdForUpdateAsync(Guid id)
    {
        return await _dbContext.Products
            .Include(p => p.Images)
            .Include(p => p.ProductTags).ThenInclude(pt => pt.Tag)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Product?> GetByIdForOptionsUpdateAsync(Guid id)
    {
        return await _dbContext.Products
            .Include(p => p.Options).ThenInclude(o => o.Values)
            .Include(p => p.Variants).ThenInclude(v => v.OptionValues).ThenInclude(ov => ov.OptionValue)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task DeleteOptionAsync(Product product, ProductOption option)
    {
        var valueIds = option.Values.Select(v => v.Id).ToList();

        var linksToDelete = await _dbContext.VariantOptionValues
            .IgnoreQueryFilters()
            .Where(vov => valueIds.Contains(vov.OptionValueId))
            .ToListAsync();

        _dbContext.VariantOptionValues.RemoveRange(linksToDelete);
        _dbContext.ProductOptions.Remove(option);

        await _dbContext.SaveChangesAsync();
    }

    public async Task DeleteOptionValueAsync(Product product, ProductOptionValue value)
    {
        var linksToDelete = await _dbContext.VariantOptionValues
            .IgnoreQueryFilters()
            .Where(vov => vov.OptionValueId == value.Id)
            .ToListAsync();

        _dbContext.VariantOptionValues.RemoveRange(linksToDelete);
        _dbContext.ProductOptionValues.Remove(value);

        await _dbContext.SaveChangesAsync();
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<ProductVariant?> GetVariantByIdAsync(Guid variantId)
    {
        return await _dbContext.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == variantId);
    }

    public async Task AddAsync(Product product)
    {
        await _dbContext.Products.AddAsync(product);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// Atomically adjusts the stock quantity of a product variant in a single conditional SQL UPDATE statement.
    /// This prevents lost updates and concurrency issues under concurrent orders or adjustments.
    /// It is atomic on purpose and must stay that way.
    /// </summary>
    public async Task<int> AdjustStockAsync(Guid variantId, int delta)
    {
        return await _dbContext.ProductVariants
            .Where(v => v.Id == variantId
                     && v.StockQuantity + delta >= 0
                     && v.StockQuantity + delta <= ProductVariant.MaxStockQuantity)
            .ExecuteUpdateAsync(s => s
                .SetProperty(v => v.StockQuantity, v => v.StockQuantity + delta)
                .SetProperty(v => v.UpdatedAt, DateTime.UtcNow));
    }

    public async Task<int?> GetStockAsync(Guid variantId)
    {
        return await _dbContext.ProductVariants
            .AsNoTracking()
            .Where(v => v.Id == variantId)
            .Select(v => (int?)v.StockQuantity)
            .FirstOrDefaultAsync();
    }
}
