using Ecomm.Domain.Entities.Categories;
using Ecomm.Domain.Entities.Tags;
using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Products;

public class Product
{
    public const int MaxImagesCount = 10;
    public const int MaxTagsCount = 20;

    private readonly List<ProductImage> _images = [];
    private readonly List<ProductTags> _productTags = [];
    private readonly List<ProductOption> _options = [];
    private readonly List<ProductVariant> _variants = [];

    public Guid Id { get; init; } = Guid.CreateVersion7();
    public string Name { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public Guid CategoryId { get; private set; }
    public Category Category { get; private set; } = null!;

    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    public IReadOnlyCollection<ProductImage> Images => _images.AsReadOnly();
    public IReadOnlyCollection<ProductTags> ProductTags => _productTags.AsReadOnly();
    public IReadOnlyCollection<ProductOption> Options => _options.AsReadOnly();
    public IReadOnlyCollection<ProductVariant> Variants => _variants.AsReadOnly();

    private Product() { }

    public Product(string name, string description, Guid categoryId)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Product name cannot be empty.");
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Product description cannot be empty.");
        if (categoryId == Guid.Empty)
            throw new DomainException("Product category cannot be empty.");

        Name = name.Trim();
        Description = description.Trim();
        CategoryId = categoryId;

        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Product name cannot be empty.");

        Name = name.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException("Product description cannot be empty.");

        Description = description.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateCategory(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            throw new DomainException("Product category cannot be empty.");

        CategoryId = categoryId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetImages(IEnumerable<string> imageUrls)
    {
        var urls = imageUrls?.ToList() ?? [];
        if (urls.Count > MaxImagesCount)
            throw new DomainException($"Product cannot have more than {MaxImagesCount} images.");

        _images.Clear();
        for (var i = 0; i < urls.Count; i++)
        {
            var url = urls[i];
            if (string.IsNullOrWhiteSpace(url))
                throw new DomainException("Product image URL cannot be empty.");

            _images.Add(new ProductImage(Id, url.Trim(), i));
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void SetTags(IEnumerable<Tag> tags)
    {
        var tagList = tags?
            .GroupBy(t => t.Id)
            .Select(g => g.First())
            .ToList() ?? [];

        if (tagList.Count > MaxTagsCount)
            throw new DomainException($"Product cannot have more than {MaxTagsCount} tags.");

        _productTags.Clear();
        foreach (var tag in tagList)
        {
            _productTags.Add(new ProductTags(Id, tag.Id) { Tag = tag });
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void ConfigureOptionsAndVariants(
        IReadOnlyList<(string Name, IReadOnlyList<string> Values)>? optionsInput,
        IReadOnlyList<(IReadOnlyDictionary<string, string>? OptionValues, decimal Price, int StockQuantity)> variantsInput)
    {
        if (_options.Count > 0 || _variants.Count > 0)
            throw new DomainException("Cannot configure options and variants on an existing product.");

        if (variantsInput == null || variantsInput.Count == 0)
            throw new DomainException("Product must have at least one variant.");

        var inputOptions = optionsInput ?? [];

        // Check unique option names
        var seenOptionNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < inputOptions.Count; i++)
        {
            var opt = inputOptions[i];
            if (string.IsNullOrWhiteSpace(opt.Name))
                throw new DomainException("Option name cannot be empty.");

            var trimmedName = opt.Name.Trim();
            if (!seenOptionNames.Add(trimmedName))
                throw new DomainException($"Duplicate option name '{trimmedName}'.");

            if (opt.Values == null || opt.Values.Count == 0)
                throw new DomainException($"Option '{trimmedName}' must have at least one value.");

            var optionEntity = new ProductOption(Id, trimmedName, i);
            foreach (var val in opt.Values)
            {
                optionEntity.AddValue(val);
            }
            _options.Add(optionEntity);
        }

        // If product has no options
        if (_options.Count == 0)
        {
            if (variantsInput.Count != 1)
                throw new DomainException("A product with no options must have exactly one variant.");

            var singleVariant = variantsInput[0];
            if (singleVariant.OptionValues != null && singleVariant.OptionValues.Count > 0)
                throw new DomainException("A product with no options cannot have option values on its variant.");

            var variantEntity = new ProductVariant(Id, singleVariant.Price, singleVariant.StockQuantity);
            _variants.Add(variantEntity);
        }
        else
        {
            // If product has options:
            // Every variant must have exactly one value for every option,
            // and no two variants have the same combination.
            var seenCombinations = new HashSet<string>();

            foreach (var vInput in variantsInput)
            {
                if (vInput.OptionValues == null)
                    throw new DomainException($"Each variant must specify a value for all {_options.Count} options.");

                var normalizedInputMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (var kvp in vInput.OptionValues)
                {
                    var key = kvp.Key?.Trim() ?? string.Empty;
                    if (string.IsNullOrEmpty(key))
                        throw new DomainException("Option key cannot be empty in variant.");

                    if (!normalizedInputMap.TryAdd(key, kvp.Value))
                        throw new DomainException($"Duplicate option key '{key}' in variant.");
                }

                // Check for unknown keys naming the key
                foreach (var inputKey in normalizedInputMap.Keys)
                {
                    if (!_options.Any(o => o.Name.Equals(inputKey, StringComparison.OrdinalIgnoreCase)))
                        throw new DomainException($"Unknown option key '{inputKey}' specified for variant.");
                }

                if (normalizedInputMap.Count != _options.Count)
                    throw new DomainException($"Each variant must specify a value for all {_options.Count} options.");

                var variantEntity = new ProductVariant(Id, vInput.Price, vInput.StockQuantity);
                var combinationKeys = new List<string>();

                // Match against each option in order of option SortOrder
                foreach (var opt in _options.OrderBy(o => o.SortOrder))
                {
                    if (!normalizedInputMap.TryGetValue(opt.Name, out var valStr) || string.IsNullOrWhiteSpace(valStr))
                        throw new DomainException($"Variant is missing value for option '{opt.Name}'.");

                    var matchedValue = opt.Values.FirstOrDefault(v => v.Value.Equals(valStr.Trim(), StringComparison.OrdinalIgnoreCase))
                        ?? throw new DomainException($"Value '{valStr}' is not valid for option '{opt.Name}'.");

                    variantEntity.AddOptionValue(matchedValue.Id);
                    combinationKeys.Add($"{opt.Name.ToLowerInvariant()}:{matchedValue.Value.ToLowerInvariant()}");
                }

                var combinationKey = string.Join("|", combinationKeys);
                if (!seenCombinations.Add(combinationKey))
                    throw new DomainException($"Duplicate variant combination: {combinationKey}");

                _variants.Add(variantEntity);
            }
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public ProductVariant AddVariant(
        IReadOnlyDictionary<string, string>? optionValues,
        decimal price,
        int stockQuantity)
    {
        var activeVariants = _variants.Where(v => v.DeletedAt == null).ToList();

        if (_options.Count == 0)
        {
            if (activeVariants.Count > 0)
                throw new DomainException("Product has no options and already has a variant. Add an option before adding more variants.");

            if (optionValues != null && optionValues.Count > 0)
                throw new DomainException("A product with no options cannot have option values on its variant.");

            var singleVariant = new ProductVariant(Id, price, stockQuantity);
            _variants.Add(singleVariant);
            UpdatedAt = DateTime.UtcNow;
            return singleVariant;
        }

        if (optionValues == null)
            throw new DomainException($"Each variant must specify a value for all {_options.Count} options.");

        var normalizedInputMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in optionValues)
        {
            var key = kvp.Key?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(key))
                throw new DomainException("Option key cannot be empty in variant.");

            if (!normalizedInputMap.TryAdd(key, kvp.Value))
                throw new DomainException($"Duplicate option key '{key}' in variant.");
        }

        foreach (var inputKey in normalizedInputMap.Keys)
        {
            if (!_options.Any(o => o.Name.Equals(inputKey, StringComparison.OrdinalIgnoreCase)))
                throw new DomainException($"Unknown option key '{inputKey}' specified for variant.");
        }

        if (normalizedInputMap.Count != _options.Count)
            throw new DomainException($"Each variant must specify a value for all {_options.Count} options.");

        var variantEntity = new ProductVariant(Id, price, stockQuantity);
        var combinationMap = new Dictionary<Guid, Guid>();

        foreach (var opt in _options.OrderBy(o => o.SortOrder))
        {
            if (!normalizedInputMap.TryGetValue(opt.Name, out var valStr) || string.IsNullOrWhiteSpace(valStr))
                throw new DomainException($"Variant is missing value for option '{opt.Name}'.");

            var matchedValue = opt.Values.FirstOrDefault(v => v.Value.Equals(valStr.Trim(), StringComparison.OrdinalIgnoreCase))
                ?? throw new DomainException($"Value '{valStr}' is not valid for option '{opt.Name}'.");

            variantEntity.AddOptionValue(matchedValue.Id);
            combinationMap[opt.Id] = matchedValue.Id;
        }

        foreach (var existingVariant in activeVariants)
        {
            var existingMap = new Dictionary<Guid, Guid>();
            foreach (var ov in existingVariant.OptionValues)
            {
                if (ov.OptionValue?.OptionId != null && ov.OptionValue.OptionId != Guid.Empty)
                {
                    existingMap[ov.OptionValue.OptionId] = ov.OptionValueId;
                }
                else
                {
                    var parentOpt = _options.FirstOrDefault(o => o.Values.Any(v => v.Id == ov.OptionValueId));
                    if (parentOpt != null)
                        existingMap[parentOpt.Id] = ov.OptionValueId;
                }
            }

            if (existingMap.Count == combinationMap.Count &&
                combinationMap.All(kv => existingMap.TryGetValue(kv.Key, out var evId) && evId == kv.Value))
            {
                throw new DomainException("A variant with this combination of option values already exists.");
            }
        }

        _variants.Add(variantEntity);
        UpdatedAt = DateTime.UtcNow;
        return variantEntity;
    }

    public ProductVariant DeleteVariant(Guid variantId)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId && v.DeletedAt == null)
            ?? throw new ProductVariantNotFoundException(variantId);

        var activeVariants = _variants.Where(v => v.DeletedAt == null).ToList();
        if (activeVariants.Count <= 1)
            throw new ProductConflictException("Cannot delete the last active variant of the product.");

        variant.Delete();
        UpdatedAt = DateTime.UtcNow;
        return variant;
    }

    public ProductOption AddOption(string name, IReadOnlyList<string> values, string? existingVariantsValue)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Option name cannot be empty.");

        var trimmedName = name.Trim();
        if (trimmedName.Length > 50)
            throw new DomainException("Option name cannot exceed 50 characters.");

        if (_options.Any(o => o.Name.Equals(trimmedName, StringComparison.OrdinalIgnoreCase)))
            throw new DomainException($"Option '{trimmedName}' already exists for this product.");

        if (values == null || values.Count == 0)
            throw new DomainException($"Option '{trimmedName}' must have at least one value.");

        var optionSortOrder = _options.Count > 0 ? _options.Max(o => o.SortOrder) + 1 : 0;
        var option = new ProductOption(Id, trimmedName, optionSortOrder);

        foreach (var val in values)
        {
            option.AddValue(val);
        }

        var activeVariants = _variants.Where(v => v.DeletedAt == null).ToList();
        if (activeVariants.Count > 0)
        {
            if (string.IsNullOrWhiteSpace(existingVariantsValue))
                throw new DomainException("ExistingVariantsValue is required when product has active variants.");

            var matchedValue = option.Values.FirstOrDefault(v => v.Value.Equals(existingVariantsValue.Trim(), StringComparison.OrdinalIgnoreCase))
                ?? throw new DomainException($"ExistingVariantsValue '{existingVariantsValue}' must be one of the new option values.");

            foreach (var variant in activeVariants)
            {
                variant.AddOptionValue(matchedValue.Id);
            }
        }

        _options.Add(option);
        UpdatedAt = DateTime.UtcNow;
        return option;
    }

    public void RenameOption(Guid optionId, string newName)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId)
            ?? throw new ProductOptionNotFoundException(optionId);

        if (string.IsNullOrWhiteSpace(newName))
            throw new DomainException("Option name cannot be empty.");

        var trimmedName = newName.Trim();
        if (trimmedName.Length > 50)
            throw new DomainException("Option name cannot exceed 50 characters.");

        if (_options.Any(o => o.Id != optionId && o.Name.Equals(trimmedName, StringComparison.OrdinalIgnoreCase)))
            throw new DomainException($"Option '{trimmedName}' already exists for this product.");

        option.Rename(trimmedName);
        UpdatedAt = DateTime.UtcNow;
    }

    public (ProductOption Option, List<Guid> ValueIds) DeleteOption(Guid optionId)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId)
            ?? throw new ProductOptionNotFoundException(optionId);

        var remainingOptions = _options.Where(o => o.Id != optionId).ToList();
        var activeVariants = _variants.Where(v => v.DeletedAt == null).ToList();

        if (remainingOptions.Count == 0)
        {
            if (activeVariants.Count != 1)
                throw new ProductConflictException("Cannot delete option: a product with no options must have exactly one active variant. Please delete other variants first.");
        }
        else
        {
            var seenKeys = new HashSet<string>();
            var valueIdsOfThisOption = option.Values.Select(v => v.Id).ToHashSet();

            foreach (var variant in activeVariants)
            {
                var remainingLinks = variant.OptionValues
                    .Where(ov => !valueIdsOfThisOption.Contains(ov.OptionValueId))
                    .OrderBy(ov => ov.OptionValueId)
                    .Select(ov => ov.OptionValueId.ToString())
                    .ToList();

                var key = string.Join("|", remainingLinks);
                if (!seenKeys.Add(key))
                {
                    throw new ProductConflictException("Cannot delete option: active variants would have duplicate combinations on the remaining options. Please delete conflicting variants first.");
                }
            }
        }

        var valueIds = option.Values.Select(v => v.Id).ToList();
        _options.Remove(option);

        foreach (var variant in _variants)
        {
            foreach (var valId in valueIds)
            {
                variant.RemoveOptionValue(valId);
            }
        }

        UpdatedAt = DateTime.UtcNow;
        return (option, valueIds);
    }

    public ProductOptionValue AddOptionValue(Guid optionId, string value)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId)
            ?? throw new ProductOptionNotFoundException(optionId);

        option.AddValue(value);
        UpdatedAt = DateTime.UtcNow;
        return option.Values.OrderBy(v => v.SortOrder).Last();
    }

    public void RenameOptionValue(Guid optionId, Guid valueId, string newValue)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId)
            ?? throw new ProductOptionNotFoundException(optionId);

        var val = option.Values.FirstOrDefault(v => v.Id == valueId)
            ?? throw new ProductOptionValueNotFoundException(valueId);

        if (string.IsNullOrWhiteSpace(newValue))
            throw new DomainException("Option value cannot be empty.");

        var trimmed = newValue.Trim();
        if (trimmed.Length > 100)
            throw new DomainException("Option value cannot exceed 100 characters.");

        if (option.Values.Any(v => v.Id != valueId && v.Value.Equals(trimmed, StringComparison.OrdinalIgnoreCase)))
            throw new DomainException($"Option value '{trimmed}' already exists for option '{option.Name}'.");

        val.Rename(trimmed);
        UpdatedAt = DateTime.UtcNow;
    }

    public ProductOptionValue DeleteOptionValue(Guid optionId, Guid valueId)
    {
        var option = _options.FirstOrDefault(o => o.Id == optionId)
            ?? throw new ProductOptionNotFoundException(optionId);

        var val = option.Values.FirstOrDefault(v => v.Id == valueId)
            ?? throw new ProductOptionValueNotFoundException(valueId);

        if (option.Values.Count <= 1)
            throw new ProductConflictException($"Cannot delete the last value of option '{option.Name}'.");

        var activeVariants = _variants.Where(v => v.DeletedAt == null).ToList();
        if (activeVariants.Any(v => v.OptionValues.Any(ov => ov.OptionValueId == valueId)))
            throw new ProductConflictException($"Cannot delete option value '{val.Value}' because it is in use by one or more active variants.");

        option.RemoveValue(val);
        UpdatedAt = DateTime.UtcNow;
        return val;
    }

    public void Delete()
    {
        if (DeletedAt != null)
            throw new DomainException("Product is already deleted.");

        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
