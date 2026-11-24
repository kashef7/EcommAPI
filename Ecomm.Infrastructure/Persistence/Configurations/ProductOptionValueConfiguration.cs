using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class ProductOptionValueConfiguration : IEntityTypeConfiguration<ProductOptionValue>
{
    public void Configure(EntityTypeBuilder<ProductOptionValue> builder)
    {
        builder.ToTable("ProductOptionValues");

        builder.HasKey(ov => ov.Id);
        builder.Property(ov => ov.Id).ValueGeneratedNever();

        builder.Property(ov => ov.OptionId).IsRequired();

        builder.Property(ov => ov.Value)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(ov => new { ov.OptionId, ov.Value })
            .IsUnique();

        builder.HasOne(ov => ov.Option)
            .WithMany(o => o.Values)
            .HasForeignKey(ov => ov.OptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
