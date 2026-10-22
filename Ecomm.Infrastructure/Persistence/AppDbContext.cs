using System.Reflection;
using Ecomm.Domain.Entities.Products;
using Ecomm.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;

namespace Ecomm.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
