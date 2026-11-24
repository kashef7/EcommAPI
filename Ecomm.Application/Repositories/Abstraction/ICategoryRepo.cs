using Ecomm.Domain.Entities.Categories;

namespace Ecomm.Application.Repositories.Abstraction;

public interface ICategoryRepo
{
    Task<IReadOnlyList<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(Guid id);
    Task AddAsync(Category category);
    Task<bool> HasProductsAsync(Guid categoryId);
    void Delete(Category category);
    Task SaveChangesAsync();
}
