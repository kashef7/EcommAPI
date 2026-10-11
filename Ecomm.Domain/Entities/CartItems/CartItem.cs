using Ecomm.Domain.Entities.Carts;
using Ecomm.Domain.Entities.Products;

namespace Ecomm.Domain.Entities.CartItems;

public class CartItem
{
    public Guid CartId { get; init; }
    public Cart Cart { get; init; }
    public Guid ProductId { get; init; }
    public Product Product { get; init; }
    public int Quantity { get; private set; }
    
    public CartItem(){}

    public CartItem(Cart cart, Product product, int quantity)
    {
        CartId = cart.Id;
        Cart =  cart;
        ProductId = product.Id;
        Product = product;
        Quantity = quantity;
        
    }
    
    public void UpdateQuantity(int quantity)
    {
        Quantity = quantity;
    }
}