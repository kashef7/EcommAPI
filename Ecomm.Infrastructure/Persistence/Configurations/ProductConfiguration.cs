using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Id)
            .ValueGeneratedNever();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.CategoryId)
            .IsRequired();

        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt)
            .IsRequired();

        builder.Property(p => p.DeletedAt);

        builder.HasQueryFilter(p => p.DeletedAt == null);

        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.Name);

        builder.HasMany(p => p.Images)
            .WithOne(i => i.Product)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.Images)
            .HasField("_images")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(p => p.ProductTags)
            .WithOne(pt => pt.Product)
            .HasForeignKey(pt => pt.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.ProductTags)
            .HasField("_productTags")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(p => p.Options)
            .WithOne(o => o.Product)
            .HasForeignKey(o => o.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(p => p.Options)
            .HasField("_options")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(p => p.Variants)
            .WithOne(v => v.Product)
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Navigation(p => p.Variants)
            .HasField("_variants")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
