using Ecomm.Domain.Entities.Carts;
using Ecomm.Domain.Entities.Products;

namespace Ecomm.Domain.Entities.CartItems;

public class CartItem
{
    public Guid CartId { get; init; }
    public Cart Cart { get; init; } = null!;
    public Guid VariantId { get; init; }
    public ProductVariant Variant { get; init; } = null!;
    public int Quantity { get; private set; }
    public decimal UnitPriceAtAdd { get; private set; }
    
    private CartItem() { }

    internal CartItem(Cart cart, ProductVariant variant, int quantity)
    {
        CartId = cart.Id;
        Cart = cart;
        VariantId = variant.Id;
        Variant = variant;
        Quantity = quantity;
        UnitPriceAtAdd = variant.Price;
    }
    
    internal void UpdateQuantity(int quantity)
    {
        Quantity = quantity;
    }

    internal void IncreaseQuantity(int quantity)
    {
        Quantity += quantity;
    }

    public void UpdateUnitPriceAtAdd(decimal newPrice)
    {
        UnitPriceAtAdd = newPrice;
    }
}
