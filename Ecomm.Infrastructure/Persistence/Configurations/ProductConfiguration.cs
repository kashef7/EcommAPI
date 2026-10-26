namespace Ecomm.Infrastructure.Persistence.Configurations;

using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products", t =>
        {
            t.HasCheckConstraint("CK_Products_Price_Positive", "\"Price\" > 0");
            t.HasCheckConstraint("CK_Products_Stock_NonNegative", "\"StockQuantity\" >= 0");
        });

        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Id)
            .ValueGeneratedNever();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.Price)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(p => p.StockQuantity)
            .IsRequired();

        builder.Property(p => p.Tag)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.ImageUrl)
            .HasMaxLength(2048);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt)
            .IsRequired();

        builder.Property(p => p.DeletedAt);

        // Soft delete: queries that must include archived products (e.g. order history) have to call IgnoreQueryFilters()
        builder.HasQueryFilter(p => p.DeletedAt == null);

        builder.HasIndex(p => p.Tag);
        builder.HasIndex(p => p.Name);
    }
}
