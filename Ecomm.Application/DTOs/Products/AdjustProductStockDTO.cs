using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.Products;

public record AdjustProductStockDTO : IValidatableObject
{
    [Required]
    [Range(-1000000, 1000000)]
    public int? Delta { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Delta == 0)
        {
            yield return new ValidationResult(
                "Delta cannot be zero.",
                [nameof(Delta)]);
        }
    }
}
