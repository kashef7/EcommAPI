namespace Ecomm.Application.DTOs.Carts;

public record GetCartItemsDTO(IReadOnlyList<CartItemDTO> CartItems, decimal TotalPrice);
