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
        await Assert.ThrowsAsync<DuplicateEmailException>(() =>
            auth.RegisterAsync("Other", "test@example.com", "another long password", default));
        Assert.NotNull(await auth.LoginAsync("TEST@example.com", "a sufficiently long password", default));
        Assert.Null(await auth.LoginAsync("TEST@example.com", "wrong password", default));
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
    }
}
