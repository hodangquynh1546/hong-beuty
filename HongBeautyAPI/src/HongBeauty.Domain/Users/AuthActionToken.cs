namespace HongBeauty.Domain.Users;

public sealed class AuthActionToken
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public string Purpose { get; private set; } = string.Empty;
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? ConsumedAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private AuthActionToken() { }

    public AuthActionToken(Guid userId, string purpose, string tokenHash, DateTimeOffset expiresAt)
    {
        UserId = userId;
        Purpose = purpose;
        TokenHash = tokenHash;
        ExpiresAt = expiresAt;
    }
}
