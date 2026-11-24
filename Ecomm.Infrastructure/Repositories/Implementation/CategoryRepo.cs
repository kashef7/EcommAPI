using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Domain.Entities.Categories;
using Ecomm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Repositories.Implementation;

public class CategoryRepo : ICategoryRepo
{
    private readonly AppDbContext _dbContext;

    public CategoryRepo(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Category>> GetAllAsync()
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Category?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task AddAsync(Category category)
    {
        await _dbContext.Categories.AddAsync(category);
    }

    public async Task<bool> HasProductsAsync(Guid categoryId)
    {
        // Check if any product (including soft-deleted if needed, or query without filter) exists with this CategoryId.
        // IgnoreQueryFilters ensures soft-deleted products also prevent deleting a category if foreign key constraint would fail.
        return await _dbContext.Products
            .IgnoreQueryFilters()
            .AnyAsync(p => p.CategoryId == categoryId);
    }

    public void Delete(Category category)
    {
        _dbContext.Categories.Remove(category);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
