using HongBeauty.Domain.Users;

namespace HongBeauty.Application.Features.Auth;

public sealed record AuthUserDto(Guid Id, string FullName, string Email, string[] Permissions, bool EmailVerified, string Role);

public interface IUserAccountStore
{
    Task<UserAccount?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<UserAccount?> FindByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(UserAccount user, CancellationToken cancellationToken);
    Task SaveAsync(CancellationToken cancellationToken);
    Task<string[]> GetPermissionsAsync(Guid userId, CancellationToken cancellationToken);
}

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string password, string encodedHash);
}

public sealed class DuplicateEmailException : Exception;

public sealed class AuthService(IUserAccountStore users, IPasswordService passwords)
{
    public async Task<AuthUserDto> RegisterAsync(string fullName, string email, string password, CancellationToken cancellationToken)
    {
        var normalizedEmail = UserAccount.NormalizeEmail(email);
        if (await users.FindByEmailAsync(normalizedEmail, cancellationToken) is not null)
            throw new DuplicateEmailException();

        var user = new UserAccount(fullName, email, passwords.Hash(password));
        await users.AddAsync(user, cancellationToken);
        return await ToDtoAsync(user, cancellationToken);
    }

    public async Task<AuthUserDto?> LoginAsync(string email, string password, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailAsync(UserAccount.NormalizeEmail(email), cancellationToken);
        return user is not null && passwords.Verify(password, user.PasswordHash)
            ? await ToDtoAsync(user, cancellationToken) : null;
    }

    public async Task<AuthUserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(id, cancellationToken);
        return user is null ? null : await ToDtoAsync(user, cancellationToken);
    }

    public async Task<AuthUserDto?> UpdateProfileAsync(Guid id, string fullName, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(id, cancellationToken);
        if (user is null) return null;
        user.ChangeFullName(fullName);
        await users.SaveAsync(cancellationToken);
        return await ToDtoAsync(user, cancellationToken);
    }

    private async Task<AuthUserDto> ToDtoAsync(UserAccount user, CancellationToken cancellationToken) =>
        new(user.Id, user.FullName, user.Email,
            await users.GetPermissionsAsync(user.Id, cancellationToken), user.EmailVerified, user.Role);
}
