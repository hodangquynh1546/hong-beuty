using HongBeauty.Domain.Products;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Infrastructure.Persistence;

public sealed class HongBeautyDbContext(DbContextOptions<HongBeautyDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

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
    }
}
