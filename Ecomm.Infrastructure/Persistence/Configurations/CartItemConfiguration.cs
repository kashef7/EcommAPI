using Ecomm.Domain.Entities.CartItems;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(i => new { i.CartId, i.ProductId });

        builder.HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(i => i.Quantity).IsRequired();

        // Matches Product's global query filter so EF doesn't warn about a required navigation to a filtered entity.
        builder.HasQueryFilter(i => i.Product.DeletedAt == null);
    }
}
