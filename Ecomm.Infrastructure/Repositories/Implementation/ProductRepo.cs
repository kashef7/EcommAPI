using Ecomm.Application.Repositories.Abstraction.IProductRepo;
using Ecomm.Domain.Entities.Products;
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
    public async Task<IReadOnlyList<Product>?> GetAllAsync()
    {
        throw new NotImplementedException();
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