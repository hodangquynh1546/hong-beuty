namespace HongBeauty.Domain.Users;

public static class AccountRoles
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
    public const string Customer = "Customer";
}

public sealed class UserAccount
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string Role { get; private set; } = AccountRoles.Customer;
    public bool EmailVerified { get; private set; }
    public Guid SecurityStamp { get; private set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private UserAccount() { }

    public UserAccount(string fullName, string email, string passwordHash)
    {
        FullName = fullName.Trim();
        Email = email.Trim();
        NormalizedEmail = NormalizeEmail(email);
        PasswordHash = passwordHash;
    }

    public static UserAccount CreateBootstrapAdmin(string fullName, string email, string passwordHash) =>
        new(fullName, email, passwordHash) { Role = AccountRoles.Admin };

    public static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();

    public void ChangeFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName) || fullName.Trim().Length > 120)
            throw new ArgumentException("Full name is required and must be at most 120 characters.", nameof(fullName));
        FullName = fullName.Trim();
    }

    public void VerifyEmail() => EmailVerified = true;

    public void PromoteToAdmin(string passwordHash)
    {
        Role = AccountRoles.Admin;
        ChangePassword(passwordHash);
    }

    public void ChangePassword(string passwordHash)
    {
        PasswordHash = passwordHash;
        SecurityStamp = Guid.NewGuid();
    }
}
