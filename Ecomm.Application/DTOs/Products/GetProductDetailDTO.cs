namespace Ecomm.Application.DTOs.Products;

public record GetProductDetailDTO(
    Guid Id,
    string Name,
    string Description,
    CategoryReferenceDTO Category,
    IReadOnlyList<string> Tags,
    IReadOnlyList<ProductImageDetailDTO> Images,
    IReadOnlyList<ProductOptionDetailDTO> Options,
    IReadOnlyList<ProductVariantDetailDTO> Variants,
    DateTime CreatedAt);

public record CategoryReferenceDTO(Guid Id, string Name);

public record ProductImageDetailDTO(string Url, int SortOrder);

public record ProductOptionDetailDTO(string Name, IReadOnlyList<string> Values);

public record ProductVariantDetailDTO(
    Guid Id,
    decimal Price,
    int StockQuantity,
    IReadOnlyDictionary<string, string> OptionValues);
