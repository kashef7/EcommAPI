namespace Ecomm.Domain.Query.Product;

public record ProductQuery(int PageNumber,int PageSize,string? Name,string? Tag,decimal? MinPrice,decimal? MaxPrice,bool InStock);