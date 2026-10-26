using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Queries.Products;

namespace Ecomm.Application.Repositories.Abstraction;

public interface IProductRepo
{
    Task<(IReadOnlyList<Product> items, int totalCount)> GetAllAsync(ProductQuery query);
    Task<Product?> GetByIdAsync(Guid id);
    Task AddAsync(Product product);
    Task SaveChangesAsync();
}
