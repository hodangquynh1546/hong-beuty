namespace HongBeauty.Domain.Orders;

public sealed class CartItem
{
    public Guid UserId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    private CartItem() { }
    public CartItem(Guid userId, Guid productId, int quantity)
    {
        if (quantity is < 1 or > 99) throw new ArgumentOutOfRangeException(nameof(quantity));
        UserId = userId; ProductId = productId; Quantity = quantity;
    }
    public void SetQuantity(int quantity)
    {
        if (quantity is < 1 or > 99) throw new ArgumentOutOfRangeException(nameof(quantity));
        Quantity = quantity;
    }
}

public sealed class CustomerAddress
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public string Recipient { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Line1 { get; private set; } = string.Empty;
    public string Ward { get; private set; } = string.Empty;
    public string District { get; private set; } = string.Empty;
    public string Province { get; private set; } = string.Empty;
    private CustomerAddress() { }
    public CustomerAddress(Guid userId, string recipient, string phone, string line1, string ward, string district, string province)
    {
        UserId = userId; Recipient = recipient.Trim(); Phone = phone.Trim(); Line1 = line1.Trim();
        Ward = ward.Trim(); District = district.Trim(); Province = province.Trim();
    }
}

public static class OrderStatuses
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Shipped = "Shipped";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public sealed class CustomerOrder
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public Guid AddressId { get; private set; }
    public string Recipient { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string AddressLine { get; private set; } = string.Empty;
    public string Status { get; private set; } = OrderStatuses.Pending;
    public string PaymentStatus { get; private set; } = "Unpaid";
    public string ShippingStatus { get; private set; } = "NotCreated";
    public decimal Subtotal { get; private set; }
    public decimal ShippingFee { get; private set; }
    public decimal Total { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public List<CustomerOrderItem> Items { get; private set; } = [];
    private CustomerOrder() { }
    public CustomerOrder(Guid userId, CustomerAddress address, IEnumerable<CustomerOrderItem> items, decimal shippingFee)
    {
        UserId = userId; AddressId = address.Id; Recipient = address.Recipient; Phone = address.Phone;
        AddressLine = string.Join(", ", new[] { address.Line1, address.Ward, address.District, address.Province });
        Items = items.ToList();
        if (Items.Count == 0 || shippingFee < 0) throw new ArgumentException("Order requires items and a valid shipping fee.");
        ShippingFee = shippingFee;
        Subtotal = Items.Sum(x => x.UnitPrice * x.Quantity);
        Total = Subtotal + shippingFee;
    }
    public bool Cancel()
    {
        if (Status == OrderStatuses.Cancelled) return false;
        if (Status is OrderStatuses.Shipped or OrderStatuses.Completed || PaymentStatus == "Paid")
            throw new InvalidOperationException("This order cannot be cancelled automatically.");
        Status = OrderStatuses.Cancelled;
        return true;
    }
    public void SetStatus(string status)
    {
        if (Status == OrderStatuses.Cancelled || status == OrderStatuses.Cancelled) throw new InvalidOperationException("Use cancellation flow.");
        var allowed = Status switch
        {
            OrderStatuses.Pending => status == OrderStatuses.Confirmed,
            OrderStatuses.Confirmed => status == OrderStatuses.Shipped,
            OrderStatuses.Shipped => status == OrderStatuses.Completed,
            _ => false
        };
        if (!allowed) throw new InvalidOperationException("Invalid order status transition.");
        Status = status;
        if (status == OrderStatuses.Shipped) ShippingStatus = "Shipped";
        if (status == OrderStatuses.Completed) ShippingStatus = "Delivered";
    }
}

public sealed class CustomerOrderItem
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public string? ImageUrl { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    private CustomerOrderItem() { }
    public CustomerOrderItem(Guid productId, string productName, string? imageUrl, decimal unitPrice, int quantity)
    {
        if (unitPrice < 0 || quantity < 1) throw new ArgumentOutOfRangeException(nameof(quantity));
        ProductId = productId; ProductName = productName; ImageUrl = imageUrl; UnitPrice = unitPrice; Quantity = quantity;
    }
}
