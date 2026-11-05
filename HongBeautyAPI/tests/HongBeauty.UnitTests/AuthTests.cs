using HongBeauty.Application.Features.Auth;
using HongBeauty.Domain.Users;
using HongBeauty.Infrastructure.Features.Auth;

namespace HongBeauty.UnitTests;

public sealed class AuthTests
{
    [Fact]
    public void PasswordHash_IsSalted_AndRejectsWrongPassword()
    {
        var passwords = new Pbkdf2PasswordService();
        var first = passwords.Hash("a sufficiently long password");
        var second = passwords.Hash("a sufficiently long password");
        Assert.NotEqual(first, second);
        Assert.True(passwords.Verify("a sufficiently long password", first));
        Assert.False(passwords.Verify("wrong password", first));
        Assert.False(passwords.Verify("anything", "invalid"));
    }

    [Fact]
    public async Task Register_DoesNotAssignPermissions_AndRejectsDuplicateEmail()
    {
        var auth = new AuthService(new MemoryUserStore(), new Pbkdf2PasswordService());
        var user = await auth.RegisterAsync("  Nguyễn A ", " Test@Example.com ", "a sufficiently long password", default);
        Assert.Equal("Nguyễn A", user.FullName);
        Assert.Empty(user.Permissions);
        Assert.Equal(AccountRoles.Customer, user.Role);
        await Assert.ThrowsAsync<DuplicateEmailException>(() =>
            auth.RegisterAsync("Other", "test@example.com", "another long password", default));
        Assert.NotNull(await auth.LoginAsync("TEST@example.com", "a sufficiently long password", default));
        Assert.Null(await auth.LoginAsync("TEST@example.com", "wrong password", default));
    }

    [Fact]
    public async Task PasswordChange_RequiresCurrentPassword_AndRotatesSecurityStamp()
    {
        var users = new MemoryUserStore();
        var passwords = new Pbkdf2PasswordService();
        var auth = new AuthService(users, passwords);
        var lifecycle = new AuthLifecycleService(users, new MemoryActionStore(users), passwords, new CaptureNotifications());
        var account = await auth.RegisterAsync("User", "user@example.com", "original password 123", default);
        var before = (await users.FindByIdAsync(account.Id, default))!.SecurityStamp;
        Assert.False(await lifecycle.ChangePasswordAsync(account.Id, "wrong", "new password 12345", default));
        Assert.True(await lifecycle.ChangePasswordAsync(account.Id, "original password 123", "new password 12345", default));
        Assert.NotEqual(before, (await users.FindByIdAsync(account.Id, default))!.SecurityStamp);
        Assert.Null(await auth.LoginAsync("user@example.com", "original password 123", default));
        Assert.NotNull(await auth.LoginAsync("user@example.com", "new password 12345", default));
    }

    [Fact]
    public async Task RegistrationAlwaysCreatesCustomer_AndProfileUpdateChangesOnlyName()
    {
        var users = new MemoryUserStore();
        var auth = new AuthService(users, new Pbkdf2PasswordService());
        var registered = await auth.RegisterAsync("First Name", "role-test@example.com", "long password 123", default);
        Assert.Equal(AccountRoles.Customer, registered.Role);
        Assert.Empty(registered.Permissions);
        var updated = await auth.UpdateProfileAsync(registered.Id, "  New Name  ", default);
        Assert.NotNull(updated);
        Assert.Equal("New Name", updated.FullName);
        Assert.Equal(registered.Email, updated.Email);
        Assert.Equal(AccountRoles.Customer, updated.Role);
        Assert.Throws<ArgumentException>(() => UserAccount.CreateBootstrapAdmin("A", "a@example.com", "hash").ChangeFullName(" "));
    }

    [Fact]
    public async Task ResetTokens_AreHashed_Expire_AndCannotBeReused()
    {
        var users = new MemoryUserStore();
        var passwords = new Pbkdf2PasswordService();
        var actions = new MemoryActionStore(users);
        var notifications = new CaptureNotifications();
        var auth = new AuthService(users, passwords);
        var lifecycle = new AuthLifecycleService(users, actions, passwords, notifications);
        await auth.RegisterAsync("User", "user@example.com", "original password 123", default);
        await lifecycle.RequestPasswordResetAsync("missing@example.com", default);
        Assert.Null(notifications.ResetToken);
        await lifecycle.RequestPasswordResetAsync("user@example.com", default);
        var token = Assert.IsType<string>(notifications.ResetToken);
        Assert.NotEqual(token, actions.LastToken!.TokenHash);
        Assert.Equal(AuthLifecycleService.HashToken(token), actions.LastToken.TokenHash);
        Assert.InRange(actions.LastToken.ExpiresAt, DateTimeOffset.UtcNow.AddMinutes(29), DateTimeOffset.UtcNow.AddMinutes(31));
        Assert.True(await lifecycle.ResetPasswordAsync(token, "new password 12345", default));
        Assert.False(await lifecycle.ResetPasswordAsync(token, "another password 123", default));
        Assert.NotNull(await auth.LoginAsync("user@example.com", "new password 12345", default));
    }

    private sealed class CaptureNotifications : IAccountNotificationSender
    {
        public string? ResetToken { get; private set; }
        public Task SendVerificationAsync(string email, string token, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken)
        {
            ResetToken = token;
            return Task.CompletedTask;
        }
    }

    private sealed class MemoryActionStore(MemoryUserStore users) : IAuthActionStore
    {
        public HongBeauty.Domain.Users.AuthActionToken? LastToken { get; private set; }
        private bool _consumed;
        public Task AddAsync(HongBeauty.Domain.Users.AuthActionToken token, CancellationToken cancellationToken)
        {
            LastToken = token;
            _consumed = false;
            return Task.CompletedTask;
        }
        public Task<bool> VerifyEmailAsync(string hash, DateTimeOffset now, CancellationToken cancellationToken) => Task.FromResult(false);
        public async Task<bool> ResetPasswordAsync(string hash, string passwordHash, DateTimeOffset now, CancellationToken cancellationToken)
        {
            var valid = !_consumed && LastToken?.TokenHash == hash && LastToken.ExpiresAt > now;
            if (valid) _consumed = true;
            if (valid)
            {
                var account = await users.FindByIdAsync(LastToken!.UserId, cancellationToken);
                account!.ChangePassword(passwordHash);
            }
            return valid;
        }
    }

    private sealed class MemoryUserStore : IUserAccountStore
    {
        private readonly List<UserAccount> _users = [];
        public Task<UserAccount?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
            Task.FromResult(_users.SingleOrDefault(x => x.NormalizedEmail == normalizedEmail));
        public Task<UserAccount?> FindByIdAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(_users.SingleOrDefault(x => x.Id == id));
        public Task AddAsync(UserAccount user, CancellationToken cancellationToken)
        {
            _users.Add(user);
            return Task.CompletedTask;
        }
        public Task SaveAsync(CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<string[]> GetPermissionsAsync(Guid userId, CancellationToken cancellationToken) =>
            Task.FromResult(Array.Empty<string>());
    }
}
