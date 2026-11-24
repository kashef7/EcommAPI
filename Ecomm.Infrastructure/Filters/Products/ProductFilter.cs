using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Queries.Products;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Filters.Products;

public static class ProductFilter
{
    public static IQueryable<Product> ApplyQueryFilters(this IQueryable<Product> products, ProductQuery query)
    {
        if (query.CategoryId.HasValue)
        {
            products = products.Where(p => p.CategoryId == query.CategoryId.Value);
        }

        if (query.Tags != null && query.Tags.Count > 0)
        {
            var normalizedTags = query.Tags
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim().ToLowerInvariant())
                .ToList();

            if (normalizedTags.Count > 0)
            {
                products = products.Where(p => p.ProductTags.Any(pt => normalizedTags.Contains(pt.Tag.Name)));
            }
        }

        if (!string.IsNullOrWhiteSpace(query.Name))
        {
            var escaped = query.Name
                .Replace(@"\", @"\\")
                .Replace("%", @"\%")
                .Replace("_", @"\_");
            products = products.Where(x => EF.Functions.ILike(x.Name, $"%{escaped}%"));
        }

        if (query.InStock)
        {
            products = products.Where(x => x.Variants.Any(v => v.StockQuantity > 0));
        }

        if (query.MinPrice.HasValue || query.MaxPrice.HasValue)
        {
            var min = query.MinPrice;
            var max = query.MaxPrice;

            products = products.Where(p =>
                p.Variants.Any(v => v.StockQuantity > 0 && (!min.HasValue || v.Price >= min.Value) && (!max.HasValue || v.Price <= max.Value))
                || (!p.Variants.Any(v => v.StockQuantity > 0) && p.Variants.Any(v => (!min.HasValue || v.Price >= min.Value) && (!max.HasValue || v.Price <= max.Value))));
        }

        return products;
    }
}
