using HongBeauty.Domain.Orders;

namespace HongBeauty.Application.Features.Orders;

public sealed record CartLineDto(Guid ProductId, string Name, string? ImageUrl, decimal UnitPrice, int Quantity, decimal LineTotal);
public sealed record CartDto(IReadOnlyList<CartLineDto> Items, decimal Subtotal);
public sealed record AddressInput(string Recipient, string Phone, string Line1, string Ward, string District, string Province);
public sealed record AddressDto(Guid Id, string Recipient, string Phone, string Line1, string Ward, string District, string Province);
public sealed record OrderLineDto(Guid ProductId, string ProductName, string? ImageUrl, decimal UnitPrice, int Quantity, decimal LineTotal);
public sealed record OrderAddressDto(string Recipient, string Phone, string AddressLine);
public sealed record OrderDto(Guid Id, DateTimeOffset CreatedAt, string Status, string PaymentStatus, string ShippingStatus,
    decimal Subtotal, decimal ShippingFee, decimal Total, OrderAddressDto Address, IReadOnlyList<OrderLineDto> Items, DateTimeOffset? PaidAt = null);

public interface ICommerceStore
{
    Task<CartDto> GetCartAsync(Guid userId, CancellationToken ct);
    Task<CartDto> SetCartItemAsync(Guid userId, Guid productId, int quantity, CancellationToken ct);
    Task<IReadOnlyList<AddressDto>> GetAddressesAsync(Guid userId, CancellationToken ct);
    Task<AddressDto> AddAddressAsync(Guid userId, AddressInput input, CancellationToken ct);
    Task<bool> DeleteAddressAsync(Guid userId, Guid addressId, CancellationToken ct);
    Task<OrderDto> CheckoutAsync(Guid userId, Guid addressId, CancellationToken ct);
    Task<OrderDto> CheckoutSelectedAsync(Guid userId, Guid addressId, IReadOnlyCollection<Guid> productIds, CancellationToken ct);
    Task<OrderDto> BuyNowAsync(Guid userId, Guid addressId, Guid productId, int quantity, CancellationToken ct);
    Task<IReadOnlyList<OrderDto>> GetOrdersAsync(Guid userId, CancellationToken ct);
    Task<OrderDto?> GetOrderAsync(Guid userId, Guid orderId, CancellationToken ct);
    Task<OrderDto?> CancelOrderAsync(Guid userId, Guid orderId, CancellationToken ct);
    Task<IReadOnlyList<OrderDto>> GetAdminOrdersAsync(CancellationToken ct);
    Task<OrderDto?> SetAdminStatusAsync(Guid orderId, string status, CancellationToken ct);
    Task<OrderDto?> MarkPaidAsync(Guid orderId, CancellationToken ct);
}

public sealed class CommerceConflictException(string message) : Exception(message);
public sealed class CommerceNotFoundException(string message) : Exception(message);
