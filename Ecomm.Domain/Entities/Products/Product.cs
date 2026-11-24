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
        if (variantsInput == null || variantsInput.Count == 0)
            throw new DomainException("Product must have at least one variant.");

        _options.Clear();
        _variants.Clear();

        var normalizedOptions = optionsInput?
            .Where(o => !string.IsNullOrWhiteSpace(o.Name))
            .ToList() ?? [];

        // Check unique option names
        var seenOptionNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < normalizedOptions.Count; i++)
        {
            var opt = normalizedOptions[i];
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
                if (vInput.OptionValues == null || vInput.OptionValues.Count != _options.Count)
                    throw new DomainException($"Each variant must specify a value for all {_options.Count} options.");

                var variantEntity = new ProductVariant(Id, vInput.Price, vInput.StockQuantity);
                var combinationKeys = new List<string>();

                // Match against each option in order of option SortOrder
                foreach (var opt in _options.OrderBy(o => o.SortOrder))
                {
                    if (!vInput.OptionValues.TryGetValue(opt.Name, out var valStr) || string.IsNullOrWhiteSpace(valStr))
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

    public void Delete()
    {
        if (DeletedAt != null)
            throw new DomainException("Product is already deleted.");

        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
