namespace HongBeauty.Domain.Products;

public sealed class SavedProduct
{
    public Guid UserId { get; private set; }
    public Guid ProductId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    private SavedProduct() { }
    public SavedProduct(Guid userId, Guid productId)
    {
        if (userId == Guid.Empty || productId == Guid.Empty) throw new ArgumentException("Invalid saved product.");
        UserId = userId; ProductId = productId;
    }
}
