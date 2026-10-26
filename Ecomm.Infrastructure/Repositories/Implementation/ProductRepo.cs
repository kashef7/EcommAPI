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
    public async Task<(IReadOnlyList<Product> items, int totalCount)> GetAllAsync(ProductQuery productQuery)
    {
        var query = _dbContext.Products.AsNoTracking().AsQueryable().ApplyQueryFilters(productQuery);
        
        int totalCount = await query.CountAsync();

        var paginatedQuery = query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id).Skip((productQuery.PageNumber - 1) * productQuery.PageSize)
            .Take(productQuery.PageSize);
        
        IReadOnlyList<Product> result = await paginatedQuery.ToListAsync();
        return (result, totalCount);
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
        return product;
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
    /// Atomically adjusts the stock quantity of a product in a single conditional SQL UPDATE statement.
    /// This prevents lost updates and concurrency issues under concurrent orders or adjustments.
    /// It is atomic on purpose and must stay that way.
    /// </summary>
    public async Task<int> AdjustStockAsync(Guid id, int delta)
    {
        return await _dbContext.Products
            .Where(p => p.Id == id
                     && p.StockQuantity + delta >= 0
                     && p.StockQuantity + delta <= Product.MaxStockQuantity)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.StockQuantity, p => p.StockQuantity + delta)
                .SetProperty(p => p.UpdatedAt, DateTime.UtcNow));
    }

    public async Task<int?> GetStockAsync(Guid id)
    {
        return await _dbContext.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => (int?)p.StockQuantity)
            .FirstOrDefaultAsync();
    }
}
