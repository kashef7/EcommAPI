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
}
