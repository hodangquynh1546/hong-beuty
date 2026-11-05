using HongBeauty.Application.Features.Auth;
using HongBeauty.Domain.Users;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Infrastructure.Features.Auth;

public sealed class AuthActionStore(HongBeautyDbContext db) : IAuthActionStore
{
    public async Task AddAsync(AuthActionToken token, CancellationToken cancellationToken)
    {
        db.AuthActionTokens.Add(token);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> VerifyEmailAsync(string hash, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var userId = await ConsumeAsync(hash, "verify-email", now, cancellationToken);
        if (userId is null) return false;
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is null) return false;
        user.VerifyEmail();
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(string hash, string passwordHash, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var userId = await ConsumeAsync(hash, "reset-password", now, cancellationToken);
        if (userId is null) return false;
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is null) return false;
        user.ChangePassword(passwordHash);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private async Task<Guid?> ConsumeAsync(string hash, string purpose, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var token = await db.AuthActionTokens.AsNoTracking()
            .Where(x => x.TokenHash == hash && x.Purpose == purpose && x.ConsumedAt == null && x.ExpiresAt > now)
            .Select(x => new { x.Id, x.UserId })
            .SingleOrDefaultAsync(cancellationToken);
        if (token is null) return null;
        var changed = await db.AuthActionTokens
            .Where(x => x.Id == token.Id && x.ConsumedAt == null && x.ExpiresAt > now)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedAt, now), cancellationToken);
        return changed == 1 ? token.UserId : null;
    }
}
