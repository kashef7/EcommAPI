namespace Ecomm.Application.DTOs.Carts;

public record CartValidationResultDTO(
    bool IsValid,
    IReadOnlyList<CartItemValidationIssueDTO> Items)
{
    public IReadOnlyList<CartItemValidationIssueDTO> Issues => Items;
}

public record CartItemValidationIssueDTO(
    Guid VariantId,
    string ProductName,
    string VariantLabel,
    IReadOnlyList<string> IssueTypes,
    IReadOnlyList<string> Messages,
    decimal? OldPrice = null,
    decimal? NewPrice = null,
    int? AvailableQuantity = null)
{
    public string Message => string.Join("; ", Messages);
}
