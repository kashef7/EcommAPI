using Ecomm.Domain.Entities.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class ProductTagsConfiguration : IEntityTypeConfiguration<ProductTags>
{
    public void Configure(EntityTypeBuilder<ProductTags> builder)
    {
        builder.ToTable("ProductTags");

        builder.HasKey(pt => new { pt.ProductId, pt.TagId });

        builder.HasIndex(pt => pt.TagId);

        builder.HasOne(pt => pt.Product)
            .WithMany(p => p.ProductTags)
            .HasForeignKey(pt => pt.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pt => pt.Tag)
            .WithMany()
            .HasForeignKey(pt => pt.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
