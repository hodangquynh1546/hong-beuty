namespace HongBeauty.Domain.Products;

public sealed class Product
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public decimal? SalePrice { get; private set; }
    public int Stock { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private Product() { }

    public Product(string name, string slug, string description, decimal price, int stock)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Product name and slug are required.");
        if (price < 0 || stock < 0)
            throw new ArgumentOutOfRangeException(nameof(price), "Price and stock cannot be negative.");
        Name = name.Trim();
        Slug = slug.Trim();
        Description = description.Trim();
        Price = price;
        Stock = stock;
    }

    public decimal EffectivePrice => SalePrice ?? Price;

    public void Reserve(int quantity)
    {
        if (quantity <= 0 || quantity > Stock)
            throw new InvalidOperationException("Insufficient inventory.");
        Stock -= quantity;
    }

    public void Restore(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        Stock = checked(Stock + quantity);
    }
}
