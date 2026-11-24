using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class ProductOptionConfiguration : IEntityTypeConfiguration<ProductOption>
{
    public void Configure(EntityTypeBuilder<ProductOption> builder)
    {
        builder.ToTable("ProductOptions");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();

        builder.Property(o => o.ProductId).IsRequired();

        builder.Property(o => o.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(o => o.SortOrder)
            .IsRequired();

        builder.HasIndex(o => new { o.ProductId, o.Name })
            .IsUnique();

        builder.HasOne(o => o.Product)
            .WithMany(p => p.Options)
            .HasForeignKey(o => o.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Values)
            .WithOne(v => v.Option)
            .HasForeignKey(v => v.OptionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(o => o.Values)
            .HasField("_values")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
