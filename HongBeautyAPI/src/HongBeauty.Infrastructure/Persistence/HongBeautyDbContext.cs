using HongBeauty.Domain.Products;
using HongBeauty.Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Infrastructure.Persistence;

public sealed class HongBeautyDbContext(DbContextOptions<HongBeautyDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<AuthActionToken> AuthActionTokens => Set<AuthActionToken>();
    public DbSet<RolePermissionGrant> RolePermissionGrants => Set<RolePermissionGrant>();
    public DbSet<BootstrapMarker> BootstrapMarkers => Set<BootstrapMarker>();

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
        product.Property(x => x.ImageUrl).HasMaxLength(2048);
        product.HasOne<Category>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        product.ToTable(table => table.HasCheckConstraint("CK_products_Price_Stock", "\"Price\" >= 0 AND \"Stock\" >= 0 AND (\"SalePrice\" IS NULL OR (\"SalePrice\" >= 0 AND \"SalePrice\" <= \"Price\"))"));
        product.Ignore(x => x.EffectivePrice);

        var category = modelBuilder.Entity<Category>();
        category.ToTable("categories");
        category.HasKey(x => x.Id);
        category.HasIndex(x => x.Slug).IsUnique();
        category.Property(x => x.Name).HasMaxLength(180).IsRequired();
        category.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        category.Property(x => x.Description).HasMaxLength(2000);

        var user = modelBuilder.Entity<UserAccount>();
        user.ToTable("users");
        user.HasKey(x => x.Id);
        user.HasIndex(x => x.NormalizedEmail).IsUnique();
        user.Property(x => x.FullName).HasMaxLength(120).IsRequired();
        user.Property(x => x.Email).HasMaxLength(254).IsRequired();
        user.Property(x => x.NormalizedEmail).HasMaxLength(254).IsRequired();
        user.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
        user.Property(x => x.Role).HasMaxLength(20).IsRequired();
        user.Property(x => x.SecurityStamp).IsRequired();
        user.ToTable(table => table.HasCheckConstraint("CK_users_Role", "\"Role\" IN ('Admin', 'Staff', 'Customer')"));

        var grant = modelBuilder.Entity<RolePermissionGrant>();
        grant.ToTable("role_permission_grants");
        grant.HasKey(x => new { x.Role, x.Permission });
        grant.Property(x => x.Role).HasMaxLength(20).IsRequired();
        grant.Property(x => x.Permission).HasMaxLength(80).IsRequired();

        var marker = modelBuilder.Entity<BootstrapMarker>();
        marker.ToTable("bootstrap_markers");
        marker.HasKey(x => x.Key);
        marker.Property(x => x.Key).HasMaxLength(80).IsRequired();

        var actionToken = modelBuilder.Entity<AuthActionToken>();
        actionToken.ToTable("auth_action_tokens");
        actionToken.HasKey(x => x.Id);
        actionToken.HasIndex(x => x.TokenHash).IsUnique();
        actionToken.Property(x => x.Purpose).HasMaxLength(32).IsRequired();
        actionToken.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
        actionToken.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
