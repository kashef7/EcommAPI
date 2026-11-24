using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("ProductImages");

        builder.HasKey(pi => pi.Id);
        builder.Property(pi => pi.Id).ValueGeneratedNever();

        builder.Property(pi => pi.ProductId).IsRequired();

        builder.Property(pi => pi.Url)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(pi => pi.SortOrder)
            .IsRequired();

        builder.Property(pi => pi.CreatedAt)
            .IsRequired();

        builder.HasIndex(pi => new { pi.ProductId, pi.SortOrder });

        builder.HasOne(pi => pi.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(pi => pi.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
