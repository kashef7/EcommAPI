namespace Ecomm.Domain.Entities.Products;

public class VariantOptionValue
{
    public Guid VariantId { get; init; }
    public ProductVariant Variant { get; init; } = null!;
    public Guid OptionValueId { get; init; }
    public ProductOptionValue OptionValue { get; init; } = null!;

    private VariantOptionValue() { }

    public VariantOptionValue(Guid variantId, Guid optionValueId)
    {
        VariantId = variantId;
        OptionValueId = optionValueId;
    }
}
