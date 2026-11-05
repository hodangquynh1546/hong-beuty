using HongBeauty.Domain.Products;
using HongBeauty.Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Infrastructure.Persistence;

public sealed class HongBeautyDbContext(DbContextOptions<HongBeautyDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<AuthActionToken> AuthActionTokens => Set<AuthActionToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var product = modelBuilder.Entity<Product>();
        product.ToTable("products");
        product.HasKey(x => x.Id);
        product.HasIndex(x => x.Slug).IsUnique();
        product.Property(x => x.Name).HasMaxLength(180).IsRequired();
        product.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        product.Property(x => x.Description).HasMaxLength(5000);
        product.Property(x => x.Price).HasPrecision(18, 2);
        product.Property(x => x.SalePrice).HasPrecision(18, 2);
        product.Ignore(x => x.EffectivePrice);

        var user = modelBuilder.Entity<UserAccount>();
        user.ToTable("users");
        user.HasKey(x => x.Id);
        user.HasIndex(x => x.NormalizedEmail).IsUnique();
        user.Property(x => x.FullName).HasMaxLength(120).IsRequired();
        user.Property(x => x.Email).HasMaxLength(254).IsRequired();
        user.Property(x => x.NormalizedEmail).HasMaxLength(254).IsRequired();
        user.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
        user.Property(x => x.Permissions).HasColumnType("text[]").IsRequired();
        user.Property(x => x.SecurityStamp).IsRequired();

        var actionToken = modelBuilder.Entity<AuthActionToken>();
        actionToken.ToTable("auth_action_tokens");
        actionToken.HasKey(x => x.Id);
        actionToken.HasIndex(x => x.TokenHash).IsUnique();
        actionToken.Property(x => x.Purpose).HasMaxLength(32).IsRequired();
        actionToken.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
        actionToken.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
