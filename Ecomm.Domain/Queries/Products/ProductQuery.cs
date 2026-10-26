namespace Ecomm.Domain.Queries.Products;

public record ProductQuery(int PageNumber, int PageSize, string? Name, string? Tag, decimal? MinPrice, decimal? MaxPrice, bool InStock);
