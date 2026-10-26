using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record ProductQueryParamsDTO() : IValidatableObject
{
    [Range(1, int.MaxValue)] public int PageNumber { get; set; } = 1;
    [Range(1, 50)] public int PageSize { get; set; } = 10;
    
    [MaxLength(200)]
    public string? Name { get; set; }
    
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal? MinPrice { get; set; }
    
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal? MaxPrice { get; set; }
    
    [MaxLength(100)]
    public string? Tag { get; set; }

    public bool InStock { get; set; } = false;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MinPrice.HasValue && MaxPrice.HasValue && MinPrice > MaxPrice)
        {
            yield return new ValidationResult(
                "MinPrice cannot be greater than MaxPrice.",
                [nameof(MinPrice), nameof(MaxPrice)]);
        }
    }
}
