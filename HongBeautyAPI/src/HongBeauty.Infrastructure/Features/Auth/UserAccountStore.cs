using HongBeauty.Application.Features.Auth;
using HongBeauty.Domain.Users;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HongBeauty.Infrastructure.Features.Auth;

public sealed class UserAccountStore(HongBeautyDbContext db) : IUserAccountStore
{
    public Task<UserAccount?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        db.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task<UserAccount?> FindByIdAsync(Guid id, CancellationToken cancellationToken) =>
        db.Users.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(UserAccount user, CancellationToken cancellationToken)
    {
        db.Users.Add(user);
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new DuplicateEmailException();
        }
    }

    public Task SaveAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);

    public async Task<string[]> GetPermissionsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var role = await db.Users.Where(x => x.Id == userId).Select(x => x.Role).SingleOrDefaultAsync(cancellationToken);
        if (role is null) return [];
        return await db.RolePermissionGrants.Where(x => x.Role == role)
            .OrderBy(x => x.Permission).Select(x => x.Permission).ToArrayAsync(cancellationToken);
    }
}
