using Ecomm.Domain.Entities.Products;

namespace Ecomm.Application.Repositories.Abstraction.IProductRepo;

public interface IProductRepo
{
    Task<IReadOnlyList<Product>?> GetAllAsync();
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product?> GetByTagAsync(string tag);
    Task AddAsync(Product product);
    Task SaveChangesAsync();
    
}