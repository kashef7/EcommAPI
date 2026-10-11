using Ecomm.Domain.Entities.Carts;
using Ecomm.Domain.Entities.Products;

namespace Ecomm.Domain.Entities.CartItems;

public class CartItem
{
    public Guid CartId { get; init; }
    public Cart Cart { get; init; } = null!;
    public Guid ProductId { get; init; }
    public Product Product { get; init; } = null!;
    public int Quantity { get; private set; }
    
    private CartItem() { }

    internal CartItem(Cart cart, Product product, int quantity)
    {
        CartId = cart.Id;
        Cart = cart;
        ProductId = product.Id;
        Product = product;
        Quantity = quantity;
    }
    
    internal void UpdateQuantity(int quantity)
    {
        Quantity = quantity;
    }

    internal void IncreaseQuantity(int quantity)
    {
        Quantity += quantity;
    }
}