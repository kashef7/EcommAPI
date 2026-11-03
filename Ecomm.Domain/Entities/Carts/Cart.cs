using Ecomm.Domain.Entities.CartItems;
using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Entities.Users;
using Ecomm.Domain.Exceptions;

namespace Ecomm.Domain.Entities.Carts;

public class Cart
{
    private readonly List<CartItem> _items = [];

    public Guid Id { get; init; } = Guid.CreateVersion7();
    
    public Guid UserId { get; init; }
    public User User { get; init; } = null!;

    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; private set; }

    public IReadOnlyCollection<CartItem> Items => _items.AsReadOnly();
    
    private Cart() { }

    public Cart(User user)
    {
        UserId = user.Id;
        User = user;
        
        var now = DateTime.UtcNow;
        CreatedAt = now;
        UpdatedAt = now;
    }

    public void AddItem(Product product, int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.");

        var existingItem = _items.FirstOrDefault(i => i.ProductId == product.Id);
        var targetQuantity = existingItem != null ? existingItem.Quantity + quantity : quantity;

        if (targetQuantity > product.StockQuantity)
            throw new InsufficientStockException(product.Id, targetQuantity, product.StockQuantity);

        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            _items.Add(new CartItem(this, product, quantity));
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateItemQuantity(Product product, int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.");

        var existingItem = _items.FirstOrDefault(i => i.ProductId == product.Id)
            ?? throw new CartItemNotFoundException(product.Id);

        if (quantity > product.StockQuantity)
            throw new InsufficientStockException(product.Id, quantity, product.StockQuantity);

        existingItem.UpdateQuantity(quantity);

        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveItem(Guid productId)
    {
        var existingItem = _items.FirstOrDefault(i => i.ProductId == productId)
            ?? throw new CartItemNotFoundException(productId);

        _items.Remove(existingItem);

        UpdatedAt = DateTime.UtcNow;
    }

    public void Clear()
    {
        _items.Clear();

        UpdatedAt = DateTime.UtcNow;
    }
}
