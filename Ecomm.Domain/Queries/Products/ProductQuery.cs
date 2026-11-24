namespace Ecomm.Domain.Queries.Products;

public record ProductQuery(
    int PageNumber,
    int PageSize,
    string? Name,
    Guid? CategoryId,
    IReadOnlyList<string>? Tags,
    decimal? MinPrice,
    decimal? MaxPrice,
    bool InStock,
    string? OrderBy = null,
    bool OrderDesc = false);
