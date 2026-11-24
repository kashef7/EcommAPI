using System.Reflection;
using Ecomm.Domain.Entities.CartItems;
using Ecomm.Domain.Entities.Carts;
using Ecomm.Domain.Entities.Categories;
using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Entities.Tags;
using Ecomm.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Cart> Carts { get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<ProductTags> ProductTags { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<ProductOption> ProductOptions { get; set; }
    public DbSet<ProductOptionValue> ProductOptionValues { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<VariantOptionValue> VariantOptionValues { get; set; }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        UpdateTimestamps();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void UpdateTimestamps()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Modified && entry.Metadata.FindProperty("UpdatedAt") != null)
            {
                entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
