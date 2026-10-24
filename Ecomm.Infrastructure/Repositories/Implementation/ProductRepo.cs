using Ecomm.Application.Repositories.Abstraction.IProductRepo;
using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Query.Product;
using Ecomm.Infrastructure.Filters.Products;
using Ecomm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Repositories.Implementation;

public class ProductRepo:IProductRepo
{
    private readonly AppDbContext _dbContext;
    
    public ProductRepo(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<(IReadOnlyList<Product>? items, int totalCount)> GetAllAsync(ProductQuery ProductQuery)
    {
        var query = _dbContext.Products.AsNoTracking().AsQueryable().ApplyQueryFilters(ProductQuery);
        
        int totalCount = await query.CountAsync();

        var paginatedQuery = query.OrderBy(x => x.Id).Skip((ProductQuery.PageNumber - 1) * ProductQuery.PageSize)
            .Take(ProductQuery.PageSize);
        
        var sql = paginatedQuery.ToQueryString();
        
        IReadOnlyList<Product> result = await paginatedQuery.ToListAsync();
        return (result, totalCount);
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == id);
        return product;
    }

    public async Task<Product?> GetByTagAsync(string tag)
    {
        throw new NotImplementedException();
    }

    public async Task AddAsync(Product product)
    {
        await _dbContext.Products.AddAsync(product);
    }

    public async Task SaveChangesAsync()
    {
        await  _dbContext.SaveChangesAsync();
    }
}