using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class VariantOptionValueConfiguration : IEntityTypeConfiguration<VariantOptionValue>
{
    public void Configure(EntityTypeBuilder<VariantOptionValue> builder)
    {
        builder.ToTable("VariantOptionValues");

        builder.HasKey(vov => new { vov.VariantId, vov.OptionValueId });

        builder.HasOne(vov => vov.Variant)
            .WithMany(v => v.OptionValues)
            .HasForeignKey(vov => vov.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(vov => vov.OptionValue)
            .WithMany()
            .HasForeignKey(vov => vov.OptionValueId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
