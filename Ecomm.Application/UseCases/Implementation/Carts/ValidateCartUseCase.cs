using Ecomm.Application.DTOs.Carts;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Ecomm.Domain.Entities.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Carts;

public class ValidateCartUseCase : IValidateCartUseCase
{
    private readonly ICartRepo _cartRepo;
    private readonly ILogger<ValidateCartUseCase> _logger;

    public ValidateCartUseCase(
        ICartRepo cartRepo,
        ILogger<ValidateCartUseCase> logger)
    {
        _cartRepo = cartRepo;
        _logger = logger;
    }

    public async Task<CartValidationResultDTO> ExecuteAsync(Guid userId)
    {
        var cart = await _cartRepo.GetCartForValidationAsync(userId);
        if (cart == null || cart.Items.Count == 0)
        {
            return new CartValidationResultDTO(true, []);
        }

        var issueItems = new List<CartItemValidationIssueDTO>();
        var itemsToRemove = new List<Guid>();
        var hasChangesToSave = false;

        foreach (var item in cart.Items.ToList())
        {
            var variant = item.Variant;
            var isUnavailable = variant == null
                || variant.DeletedAt != null
                || variant.Product == null
                || variant.Product.DeletedAt != null;

            var productName = variant?.Product?.Name ?? "Unknown Product";
            var variantLabel = BuildVariantLabel(variant);

            if (isUnavailable || variant is null)
            {
                itemsToRemove.Add(item.VariantId);
                hasChangesToSave = true;

                issueItems.Add(new CartItemValidationIssueDTO(
                    item.VariantId,
                    productName,
                    variantLabel,
                    ["Unavailable"],
                    [$"Product '{productName}' ({variantLabel}) is no longer available."],
                    null,
                    null,
                    null));

                continue;
            }

            var itemIssueTypes = new List<string>();
            var itemMessages = new List<string>();
            decimal? oldPrice = null;
            decimal? newPrice = null;
            int? availableQuantity = null;

            if (variant.StockQuantity == 0)
            {
                itemIssueTypes.Add("OutOfStock");
                availableQuantity = 0;
                itemMessages.Add($"Item '{productName}' ({variantLabel}) is out of stock.");
            }
            else if (variant.StockQuantity < item.Quantity)
            {
                itemIssueTypes.Add("InsufficientStock");
                availableQuantity = variant.StockQuantity;
                itemMessages.Add($"Item '{productName}' ({variantLabel}) has only {variant.StockQuantity} available, but {item.Quantity} requested.");
            }

            if (variant.Price != item.UnitPriceAtAdd)
            {
                itemIssueTypes.Add("PriceChanged");
                oldPrice = item.UnitPriceAtAdd;
                newPrice = variant.Price;
                itemMessages.Add($"Price for '{productName}' ({variantLabel}) changed from {item.UnitPriceAtAdd:F2} to {variant.Price:F2}.");

                item.UpdateUnitPriceAtAdd(variant.Price);
                hasChangesToSave = true;
            }

            if (itemIssueTypes.Count > 0)
            {
                issueItems.Add(new CartItemValidationIssueDTO(
                    item.VariantId,
                    productName,
                    variantLabel,
                    itemIssueTypes,
                    itemMessages,
                    oldPrice,
                    newPrice,
                    availableQuantity));
            }
        }

        foreach (var variantId in itemsToRemove)
        {
            cart.RemoveItem(variantId);
        }

        if (hasChangesToSave)
        {
            await _cartRepo.SaveChangesAsync();
        }

        var isValid = issueItems.Count == 0;
        _logger.LogInformation("Cart validation completed for user {UserId}: IsValid={IsValid}, IssuesCount={IssuesCount}",
            userId, isValid, issueItems.Count);

        return new CartValidationResultDTO(isValid, issueItems);
    }

    private static string BuildVariantLabel(ProductVariant? variant)
    {
        if (variant == null || variant.OptionValues == null || variant.OptionValues.Count == 0)
            return string.Empty;

        var labels = variant.OptionValues
            .Where(ov => ov.OptionValue?.Option != null)
            .OrderBy(ov => ov.OptionValue.Option.SortOrder)
            .ThenBy(ov => ov.OptionValue.SortOrder)
            .Select(ov => $"{ov.OptionValue.Option.Name}: {ov.OptionValue.Value}")
            .ToList();

        return labels.Count > 0 ? string.Join(", ", labels) : string.Empty;
    }
}
