namespace HongBeauty.Domain.Users;

public sealed class UserAccount
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string[] Permissions { get; private set; } = [];
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private UserAccount() { }

    public UserAccount(string fullName, string email, string passwordHash)
    {
        FullName = fullName.Trim();
        Email = email.Trim();
        NormalizedEmail = NormalizeEmail(email);
        PasswordHash = passwordHash;
    }

    public static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();

    public bool HasPermission(string permission) => Permissions.Contains(permission, StringComparer.Ordinal);
}
