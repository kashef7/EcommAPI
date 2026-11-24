using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("ProductVariants", t =>
        {
            t.HasCheckConstraint("CK_ProductVariants_Price_Positive", "\"Price\" > 0");
            t.HasCheckConstraint("CK_ProductVariants_Stock_NonNegative", "\"StockQuantity\" >= 0");
        });

        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).ValueGeneratedNever();

        builder.Property(v => v.ProductId).IsRequired();

        builder.Property(v => v.Price)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(v => v.StockQuantity)
            .IsRequired();

        builder.Property(v => v.CreatedAt)
            .IsRequired();

        builder.Property(v => v.UpdatedAt)
            .IsRequired();

        builder.Property(v => v.DeletedAt);

        builder.HasQueryFilter(v => v.DeletedAt == null);

        builder.HasIndex(v => v.ProductId);

        builder.HasOne(v => v.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(v => v.OptionValues)
            .WithOne(ov => ov.Variant)
            .HasForeignKey(ov => ov.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(v => v.OptionValues)
            .HasField("_optionValues")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
