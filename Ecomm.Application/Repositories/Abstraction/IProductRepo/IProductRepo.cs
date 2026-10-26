using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Query.Product;

namespace Ecomm.Application.Repositories.Abstraction.IProductRepo;

public interface IProductRepo
{
    Task<(IReadOnlyList<Product> items, int totalCount)> GetAllAsync(ProductQuery query);
    Task<Product?> GetByIdAsync(Guid id);
    Task AddAsync(Product product);
    Task SaveChangesAsync();
    
}
