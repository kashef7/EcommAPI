using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Queries.Products;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Filters.Products;

public static class ProductFilter
{
    public static IQueryable<Product> ApplyQueryFilters(this IQueryable<Product> products, ProductQuery query)
    {
        if (query.Tag != null)
        {
            products = products.Where(x => x.Tag == query.Tag);
        }

        if (query.Name != null)
        {
            var escaped = query.Name
                .Replace(@"\", @"\\")
                .Replace("%", @"\%")
                .Replace("_", @"\_");
            products = products.Where(x => EF.Functions.ILike(x.Name, $"%{escaped}%"));
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
            products = products.Where(x => x.Price <= query.MaxPrice);
        }

        return products;
    }
}
