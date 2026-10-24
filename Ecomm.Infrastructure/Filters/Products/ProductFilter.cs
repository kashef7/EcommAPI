using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Query.Product;

namespace Ecomm.Infrastructure.Filters.Products;

public static class ProductFilter
{
    public static IQueryable<Product> ApplyQueryFilters(this IQueryable<Product> products, ProductQuery query)
    {
        if (query.Tag != null)
        {
            products = products.Where(x => x.Tag.Contains(query.Tag));
        }

        if (query.Name != null)
        {
            products = products.Where(x => x.Name.Contains(query.Name));
        }

        if (query.InStock)
        {
            products = products.Where(x => x.StockQuantity > 0);
        }

        if (query.MinPrice != null)
        {
            products = products.Where(x => x.Price >= query.MinPrice);
        }
        
        if (query.MaxPrice != null)
        {
            products = products.Where(x => x.Price <= query.MinPrice);
        }

        return products;
    }
}