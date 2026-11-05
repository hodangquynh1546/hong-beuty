using System.Security.Cryptography;
using System.Text;
using HongBeauty.Domain.Users;

namespace HongBeauty.Application.Features.Auth;

public interface IAuthActionStore
{
    Task AddAsync(AuthActionToken token, CancellationToken cancellationToken);
    Task<bool> VerifyEmailAsync(string hash, DateTimeOffset now, CancellationToken cancellationToken);
    Task<bool> ResetPasswordAsync(string hash, string passwordHash, DateTimeOffset now, CancellationToken cancellationToken);
}

public interface IAccountNotificationSender
{
    Task SendVerificationAsync(string email, string token, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken);
}

public sealed class NotificationNotConfiguredException : Exception;

public sealed class AuthLifecycleService(
    IUserAccountStore users,
    IAuthActionStore actions,
    IPasswordService passwords,
    IAccountNotificationSender notifications)
{
    public async Task RequestVerificationAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(userId, cancellationToken);
        if (user is null || user.EmailVerified) return;
        var rawToken = NewToken();
        await actions.AddAsync(new AuthActionToken(user.Id, "verify-email", HashToken(rawToken),
            DateTimeOffset.UtcNow.AddHours(24)), cancellationToken);
        await notifications.SendVerificationAsync(user.Email, rawToken, cancellationToken);
    }

    public Task<bool> ConfirmVerificationAsync(string token, CancellationToken cancellationToken) =>
        actions.VerifyEmailAsync(HashToken(token), DateTimeOffset.UtcNow, cancellationToken);

    public async Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailAsync(UserAccount.NormalizeEmail(email), cancellationToken);
        if (user is null) return;
        var rawToken = NewToken();
        await actions.AddAsync(new AuthActionToken(user.Id, "reset-password", HashToken(rawToken),
            DateTimeOffset.UtcNow.AddMinutes(30)), cancellationToken);
        await notifications.SendPasswordResetAsync(user.Email, rawToken, cancellationToken);
    }

    public Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken) =>
        actions.ResetPasswordAsync(HashToken(token), passwords.Hash(newPassword), DateTimeOffset.UtcNow, cancellationToken);

    public async Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(userId, cancellationToken);
        if (user is null || !passwords.Verify(currentPassword, user.PasswordHash)) return false;
        user.ChangePassword(passwords.Hash(newPassword));
        await users.SaveAsync(cancellationToken);
        return true;
    }

    public static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string NewToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
