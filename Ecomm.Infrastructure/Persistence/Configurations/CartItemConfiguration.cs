using Ecomm.Domain.Entities.CartItems;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(i => new { i.CartId, i.VariantId });

        builder.HasOne(i => i.Variant)
            .WithMany()
            .HasForeignKey(i => i.VariantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(i => i.Quantity).IsRequired();

        // The CartItem global query filter must hide items whose variant is soft-deleted or whose product is soft-deleted.
        builder.HasQueryFilter(i => i.Variant.DeletedAt == null && i.Variant.Product.DeletedAt == null);
    }
}
