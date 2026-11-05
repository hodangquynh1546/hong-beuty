namespace HongBeauty.Domain.Support;

public sealed class SupportMessage
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CustomerId { get; private set; }
    public bool FromAdmin { get; private set; }
    public string Body { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReadAt { get; private set; }
    private SupportMessage() { }
    public SupportMessage(Guid customerId, bool fromAdmin, string body)
    {
        if (customerId == Guid.Empty || string.IsNullOrWhiteSpace(body) || body.Trim().Length > 2000)
            throw new ArgumentException("Invalid support message.");
        CustomerId = customerId;
        FromAdmin = fromAdmin;
        Body = body.Trim();
    }
    public void MarkRead() => ReadAt ??= DateTimeOffset.UtcNow;
}
