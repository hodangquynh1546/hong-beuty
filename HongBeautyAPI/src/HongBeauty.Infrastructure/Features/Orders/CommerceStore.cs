using System.Data;
using HongBeauty.Application.Features.Orders;
using HongBeauty.Domain.Orders;
using HongBeauty.Domain.Products;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Infrastructure.Features.Orders;

public sealed class CommerceStore(HongBeautyDbContext db) : ICommerceStore
{
    public async Task<CartDto> GetCartAsync(Guid userId, CancellationToken ct)
    {
        var rows = await (from item in db.CartItems.AsNoTracking()
                          join product in db.Products.AsNoTracking() on item.ProductId equals product.Id
                          where item.UserId == userId
                          orderby product.Name
                          select new { item, product }).ToListAsync(ct);
        var lines = rows.Select(x => new CartLineDto(x.product.Id, x.product.Name, x.product.ImageUrl,
            x.product.EffectivePrice, x.item.Quantity, x.product.EffectivePrice * x.item.Quantity)).ToList();
        return new CartDto(lines, lines.Sum(x => x.LineTotal));
    }

    public async Task<CartDto> SetCartItemAsync(Guid userId, Guid productId, int quantity, CancellationToken ct)
    {
        if (quantity is < 0 or > 99) throw new ArgumentOutOfRangeException(nameof(quantity));
        var item = await db.CartItems.FindAsync([userId, productId], ct);
        if (quantity == 0)
        {
            if (item is not null) db.CartItems.Remove(item);
        }
        else
        {
            var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Id == productId && x.IsActive, ct)
                ?? throw new CommerceNotFoundException("Product not found.");
            if (quantity > product.Stock) throw new CommerceConflictException("Insufficient inventory.");
            if (item is null) db.CartItems.Add(new CartItem(userId, productId, quantity));
            else item.SetQuantity(quantity);
        }
        await db.SaveChangesAsync(ct);
        return await GetCartAsync(userId, ct);
    }

    public async Task<IReadOnlyList<AddressDto>> GetAddressesAsync(Guid userId, CancellationToken ct) =>
        (await db.CustomerAddresses.AsNoTracking().Where(x => x.UserId == userId).ToListAsync(ct)).Select(MapAddress).ToList();

    public async Task<AddressDto> AddAddressAsync(Guid userId, AddressInput input, CancellationToken ct)
    {
        var address = new CustomerAddress(userId, input.Recipient, input.Phone, input.Line1, input.Ward, input.District, input.Province);
        db.CustomerAddresses.Add(address);
        await db.SaveChangesAsync(ct);
        return MapAddress(address);
    }

    public async Task<bool> DeleteAddressAsync(Guid userId, Guid addressId, CancellationToken ct)
    {
        var address = await db.CustomerAddresses.FirstOrDefaultAsync(x => x.Id == addressId && x.UserId == userId, ct);
        if (address is null) return false;
        if (await db.Orders.AnyAsync(x => x.AddressId == addressId, ct))
            throw new CommerceConflictException("Address is used by an order.");
        db.CustomerAddresses.Remove(address);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public Task<OrderDto> CheckoutAsync(Guid userId, Guid addressId, CancellationToken ct) =>
        CheckoutCartAsync(userId, addressId, null, ct);

    public Task<OrderDto> CheckoutSelectedAsync(Guid userId, Guid addressId, IReadOnlyCollection<Guid> productIds, CancellationToken ct) =>
        CheckoutCartAsync(userId, addressId, productIds, ct);

    private async Task<OrderDto> CheckoutCartAsync(Guid userId, Guid addressId, IReadOnlyCollection<Guid>? productIds, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        var address = await db.CustomerAddresses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == addressId && x.UserId == userId, ct)
            ?? throw new CommerceNotFoundException("Address not found.");
        // Lock this customer's cart before reading it: concurrent checkouts cannot consume it twice.
        var cart = await db.CartItems.FromSqlInterpolated($"SELECT * FROM cart_items WHERE \"UserId\" = {userId} FOR UPDATE")
            .OrderBy(x => x.ProductId).ToListAsync(ct);
        if (productIds is not null)
        {
            var selected = productIds.Distinct().ToHashSet();
            if (selected.Count == 0 || selected.Count > 99 || !selected.IsSubsetOf(cart.Select(x => x.ProductId)))
                throw new CommerceConflictException("Select available cart items.");
            cart = cart.Where(x => selected.Contains(x.ProductId)).ToList();
        }
        if (cart.Count == 0) throw new CommerceConflictException("Cart is empty.");
        var lines = new List<CustomerOrderItem>();
        foreach (var item in cart.OrderBy(x => x.ProductId))
        {
            // PostgreSQL row locks serialize stock checks and decrements across customers.
            var product = await db.Products.FromSqlInterpolated($"SELECT * FROM products WHERE \"Id\" = {item.ProductId} FOR UPDATE")
                .SingleOrDefaultAsync(ct);
            if (product is null || !product.IsActive) throw new CommerceConflictException("A product is unavailable.");
            if (item.Quantity > product.Stock) throw new CommerceConflictException($"Insufficient inventory for {product.Name}.");
            product.Reserve(item.Quantity);
            lines.Add(new CustomerOrderItem(product.Id, product.Name, product.ImageUrl, product.EffectivePrice, item.Quantity, product.CostPrice));
        }
        // MVP policy: free delivery. Provider-calculated fees arrive in Phase 5.
        var order = new CustomerOrder(userId, address, lines, 0m);
        db.Orders.Add(order);
        db.CartItems.RemoveRange(cart);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return MapOrder(order);
    }

    public async Task<OrderDto> BuyNowAsync(Guid userId, Guid addressId, Guid productId, int quantity, CancellationToken ct)
    {
        if (productId == Guid.Empty || quantity is < 1 or > 99)
            throw new CommerceConflictException("Invalid product quantity.");
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        var address = await db.CustomerAddresses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == addressId && x.UserId == userId, ct)
            ?? throw new CommerceNotFoundException("Address not found.");
        var product = await db.Products.FromSqlInterpolated($"SELECT * FROM products WHERE \"Id\" = {productId} FOR UPDATE")
            .SingleOrDefaultAsync(ct);
        if (product is null || !product.IsActive) throw new CommerceConflictException("Product is unavailable.");
        if (quantity > product.Stock) throw new CommerceConflictException("Insufficient inventory.");
        product.Reserve(quantity);
        var line = new CustomerOrderItem(product.Id, product.Name, product.ImageUrl, product.EffectivePrice, quantity, product.CostPrice);
        var order = new CustomerOrder(userId, address, [line], 0m);
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return MapOrder(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync(Guid userId, CancellationToken ct) =>
        (await db.Orders.AsNoTracking().Include(x => x.Items).Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(ct)).Select(MapOrder).ToList();

    public async Task<OrderDto?> GetOrderAsync(Guid userId, Guid orderId, CancellationToken ct)
    {
        var order = await db.Orders.AsNoTracking().Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == orderId && x.UserId == userId, ct);
        return order is null ? null : MapOrder(order);
    }

    public async Task<OrderDto?> CancelOrderAsync(Guid userId, Guid orderId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        var order = await db.Orders.FromSqlInterpolated($"SELECT * FROM orders WHERE \"Id\" = {orderId} AND \"UserId\" = {userId} FOR UPDATE")
            .Include(x => x.Items).SingleOrDefaultAsync(ct);
        if (order is null) return null;
        if (order.Cancel())
        {
            foreach (var line in order.Items.OrderBy(x => x.ProductId))
            {
                var product = await db.Products.FromSqlInterpolated($"SELECT * FROM products WHERE \"Id\" = {line.ProductId} FOR UPDATE")
                    .SingleAsync(ct);
                product.Restore(line.Quantity);
            }
            await db.SaveChangesAsync(ct);
        }
        await tx.CommitAsync(ct);
        return MapOrder(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetAdminOrdersAsync(CancellationToken ct) =>
        (await db.Orders.AsNoTracking().Include(x => x.Items).OrderByDescending(x => x.CreatedAt)
            .Take(100).ToListAsync(ct)).Select(MapOrder).ToList();

    public async Task<OrderDto?> SetAdminStatusAsync(Guid orderId, string status, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        var order = await db.Orders.FromSqlInterpolated($"SELECT * FROM orders WHERE \"Id\" = {orderId} FOR UPDATE")
            .Include(x => x.Items).SingleOrDefaultAsync(ct);
        if (order is null) return null;
        order.SetStatus(status);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return MapOrder(order);
    }

    public async Task<OrderDto?> MarkPaidAsync(Guid orderId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
        var order = await db.Orders.FromSqlInterpolated($"SELECT * FROM orders WHERE \"Id\" = {orderId} FOR UPDATE")
            .Include(x => x.Items).SingleOrDefaultAsync(ct);
        if (order is null) return null;
        order.MarkPaid();
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return MapOrder(order);
    }

    private static AddressDto MapAddress(CustomerAddress x) => new(x.Id, x.Recipient, x.Phone, x.Line1, x.Ward, x.District, x.Province);
    private static OrderDto MapOrder(CustomerOrder x) => new(x.Id, x.CreatedAt, x.Status, x.PaymentStatus, x.ShippingStatus,
        x.Subtotal, x.ShippingFee, x.Total, new OrderAddressDto(x.Recipient, x.Phone, x.AddressLine),
        x.Items.Select(i => new OrderLineDto(i.ProductId, i.ProductName, i.ImageUrl, i.UnitPrice, i.Quantity, i.UnitPrice * i.Quantity)).ToList(), x.PaidAt);
}
