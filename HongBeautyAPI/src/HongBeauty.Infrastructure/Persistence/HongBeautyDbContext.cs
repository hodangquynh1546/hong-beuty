using HongBeauty.Domain.Products;
using HongBeauty.Domain.Orders;
using HongBeauty.Domain.Users;
using HongBeauty.Domain.Services;
using HongBeauty.Domain.Reports;
using HongBeauty.Domain.Support;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Infrastructure.Persistence;

public sealed class HongBeautyDbContext(DbContextOptions<HongBeautyDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<SavedProduct> SavedProducts => Set<SavedProduct>();
    public DbSet<BeautyService> BeautyServices => Set<BeautyService>();
    public DbSet<BeautyAppointment> BeautyAppointments => Set<BeautyAppointment>();
    public DbSet<ShopExpense> ShopExpenses => Set<ShopExpense>();
    public DbSet<SupportMessage> SupportMessages => Set<SupportMessage>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<AuthActionToken> AuthActionTokens => Set<AuthActionToken>();
    public DbSet<RolePermissionGrant> RolePermissionGrants => Set<RolePermissionGrant>();
    public DbSet<BootstrapMarker> BootstrapMarkers => Set<BootstrapMarker>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<CustomerOrder> Orders => Set<CustomerOrder>();
    public DbSet<CustomerOrderItem> OrderItems => Set<CustomerOrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var support = modelBuilder.Entity<SupportMessage>();
        support.ToTable("support_messages");
        support.HasKey(x => x.Id);
        support.HasIndex(x => new { x.CustomerId, x.CreatedAt });
        support.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
        support.Property(x => x.Body).HasMaxLength(2000).IsRequired();

        var expense = modelBuilder.Entity<ShopExpense>();
        expense.ToTable("shop_expenses");
        expense.HasKey(x => x.Id);
        expense.HasIndex(x => x.OccurredAt);
        expense.Property(x => x.Category).HasMaxLength(100).IsRequired();
        expense.Property(x => x.Note).HasMaxLength(500).IsRequired();
        expense.Property(x => x.Amount).HasPrecision(18, 2);

        var appointment = modelBuilder.Entity<BeautyAppointment>();
        appointment.ToTable("beauty_appointments");
        appointment.HasKey(x => x.Id);
        appointment.HasIndex(x => new { x.ServiceId, x.StartsAt });
        appointment.HasIndex(x => new { x.UserId, x.CreatedAt });
        appointment.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        appointment.HasOne<BeautyService>().WithMany().HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Restrict);
        appointment.Property(x => x.ServiceName).HasMaxLength(180).IsRequired();
        appointment.Property(x => x.Price).HasPrecision(18, 2);
        appointment.Property(x => x.Status).HasMaxLength(20).IsRequired();

        var beautyService = modelBuilder.Entity<BeautyService>();
        beautyService.ToTable("beauty_services");
        beautyService.HasKey(x => x.Id);
        beautyService.HasIndex(x => x.Slug).IsUnique();
        beautyService.Property(x => x.Name).HasMaxLength(180).IsRequired();
        beautyService.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        beautyService.Property(x => x.Description).HasMaxLength(5000);
        beautyService.Property(x => x.Price).HasPrecision(18, 2);
        beautyService.Property(x => x.ImageUrl).HasMaxLength(2048);

        var savedProduct = modelBuilder.Entity<SavedProduct>();
        savedProduct.ToTable("saved_products");
        savedProduct.HasKey(x => new { x.UserId, x.ProductId });
        savedProduct.HasIndex(x => x.ProductId);
        savedProduct.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        savedProduct.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);

        var productImage = modelBuilder.Entity<ProductImage>();
        productImage.ToTable("product_images");
        productImage.HasKey(x => x.Id);
        productImage.Property(x => x.ContentType).HasMaxLength(30).IsRequired();
        productImage.Property(x => x.Data).IsRequired();

        var product = modelBuilder.Entity<Product>();
        product.ToTable("products");
        product.HasKey(x => x.Id);
        product.HasIndex(x => x.Slug).IsUnique();
        product.Property(x => x.Name).HasMaxLength(180).IsRequired();
        product.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        product.Property(x => x.Description).HasMaxLength(5000);
        product.Property(x => x.Price).HasPrecision(18, 2);
        product.Property(x => x.CostPrice).HasPrecision(18, 2);
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

        var cart = modelBuilder.Entity<CartItem>();
        cart.ToTable("cart_items", t => t.HasCheckConstraint("CK_cart_items_Quantity", "\"Quantity\" BETWEEN 1 AND 99"));
        cart.HasKey(x => new { x.UserId, x.ProductId });
        cart.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        cart.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);

        var address = modelBuilder.Entity<CustomerAddress>();
        address.ToTable("customer_addresses"); address.HasKey(x => x.Id);
        address.HasIndex(x => x.UserId);
        address.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        address.Property(x => x.Recipient).HasMaxLength(120).IsRequired();
        address.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        address.Property(x => x.Line1).HasMaxLength(200).IsRequired();
        address.Property(x => x.Ward).HasMaxLength(100).IsRequired();
        address.Property(x => x.District).HasMaxLength(100).IsRequired();
        address.Property(x => x.Province).HasMaxLength(100).IsRequired();

        var order = modelBuilder.Entity<CustomerOrder>();
        order.ToTable("orders", t => t.HasCheckConstraint("CK_orders_Totals", "\"Subtotal\" >= 0 AND \"ShippingFee\" >= 0 AND \"Total\" = \"Subtotal\" + \"ShippingFee\""));
        order.HasKey(x => x.Id); order.HasIndex(x => new { x.UserId, x.CreatedAt });
        order.HasOne<UserAccount>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        order.HasOne<CustomerAddress>().WithMany().HasForeignKey(x => x.AddressId).OnDelete(DeleteBehavior.Restrict);
        order.Property(x => x.Recipient).HasMaxLength(120).IsRequired();
        order.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        order.Property(x => x.AddressLine).HasMaxLength(520).IsRequired();
        order.Property(x => x.Status).HasMaxLength(20).IsRequired();
        order.Property(x => x.PaymentStatus).HasMaxLength(20).IsRequired();
        order.Property(x => x.PaidAt);
        order.Property(x => x.ShippingStatus).HasMaxLength(20).IsRequired();
        order.Property(x => x.Subtotal).HasPrecision(18, 2);
        order.Property(x => x.ShippingFee).HasPrecision(18, 2);
        order.Property(x => x.Total).HasPrecision(18, 2);
        order.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);

        var item = modelBuilder.Entity<CustomerOrderItem>();
        item.ToTable("order_items", t => t.HasCheckConstraint("CK_order_items_Quantity_Price", "\"Quantity\" > 0 AND \"UnitPrice\" >= 0"));
        item.HasKey(x => x.Id);
        item.HasIndex(x => x.ProductId);
        item.Property(x => x.ProductName).HasMaxLength(180).IsRequired();
        item.Property(x => x.ImageUrl).HasMaxLength(2048);
        item.Property(x => x.UnitPrice).HasPrecision(18, 2);
        item.Property(x => x.UnitCost).HasPrecision(18, 2);
        item.HasOne<Product>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
