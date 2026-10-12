using Ecomm.Domain.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecomm.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(320);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(u => u.IsAdmin)
            .IsRequired();

        builder.Property(u => u.CreatedAt)
            .IsRequired();
        builder.OwnsOne(u => u.RefreshToken, tokenBuilder =>
        {
            tokenBuilder.Property(RefreshToken => RefreshToken.TokenHash)
                .HasColumnName("RefreshTokenHash")
                .HasMaxLength(256);
            tokenBuilder.Property(RefreshToken => RefreshToken.ExpiresAt)
                .HasColumnName("RefreshTokenExpiresAt");
        });

        builder.HasIndex(u => u.Email)
            .IsUnique();
    }
}
