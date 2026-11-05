using HongBeauty.Domain.Users;

namespace HongBeauty.Application.Features.Auth;

public sealed record AuthUserDto(Guid Id, string FullName, string Email, string[] Permissions, bool EmailVerified);

public interface IUserAccountStore
{
    Task<UserAccount?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<UserAccount?> FindByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(UserAccount user, CancellationToken cancellationToken);
    Task SaveAsync(CancellationToken cancellationToken);
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
        return ToDto(user);
    }

    public async Task<AuthUserDto?> LoginAsync(string email, string password, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailAsync(UserAccount.NormalizeEmail(email), cancellationToken);
        return user is not null && passwords.Verify(password, user.PasswordHash) ? ToDto(user) : null;
    }

    public async Task<AuthUserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(id, cancellationToken);
        return user is null ? null : ToDto(user);
    }

    private static AuthUserDto ToDto(UserAccount user) => new(user.Id, user.FullName, user.Email, user.Permissions, user.EmailVerified);
}
