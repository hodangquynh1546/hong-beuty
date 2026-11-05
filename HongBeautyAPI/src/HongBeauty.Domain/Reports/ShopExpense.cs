namespace HongBeauty.Domain.Reports;

public sealed class ShopExpense
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Category { get; private set; } = string.Empty;
    public string Note { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    private ShopExpense() { }
    public ShopExpense(string category, string note, decimal amount, DateTimeOffset occurredAt)
    {
        if (string.IsNullOrWhiteSpace(category) || category.Length > 100 || note.Length > 500 || amount <= 0)
            throw new ArgumentException("Invalid expense.");
        Category = category.Trim(); Note = note.Trim(); Amount = amount; OccurredAt = occurredAt.ToUniversalTime();
    }
}
