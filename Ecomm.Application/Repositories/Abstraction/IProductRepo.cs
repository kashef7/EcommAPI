using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Queries.Products;

namespace Ecomm.Application.Repositories.Abstraction;

public interface IProductRepo
{
    Task<(IReadOnlyList<Product> items, int totalCount)> GetAllAsync(ProductQuery query);
    Task<Product?> GetByIdAsync(Guid id);
    Task AddAsync(Product product);
    Task SaveChangesAsync();

    /// <summary>
    /// Atomically adjusts the stock quantity of a product in a single conditional SQL UPDATE statement.
    /// This prevents lost updates and concurrency issues under concurrent orders or adjustments.
    /// It is atomic on purpose and must stay that way.
    /// </summary>
    Task<int> AdjustStockAsync(Guid id, int delta);

    Task<int?> GetStockAsync(Guid id);
}
