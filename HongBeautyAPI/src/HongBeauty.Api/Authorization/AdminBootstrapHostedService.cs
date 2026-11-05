using HongBeauty.Application.Features.Auth;
using HongBeauty.Domain.Users;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;

namespace HongBeauty.Api.Authorization;

public sealed class AdminBootstrapHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<AdminBootstrapHostedService> logger) : IHostedService
{
    private const string MarkerKey = "initial-admin";

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var email = Environment.GetEnvironmentVariable("HONG_BEAUTY_BOOTSTRAP_ADMIN_EMAIL");
        var password = Environment.GetEnvironmentVariable("HONG_BEAUTY_BOOTSTRAP_ADMIN_PASSWORD");
        var fullName = Environment.GetEnvironmentVariable("HONG_BEAUTY_BOOTSTRAP_ADMIN_FULL_NAME");
        var promoteExisting = string.Equals(Environment.GetEnvironmentVariable("HONG_BEAUTY_PROMOTE_EXISTING_ADMIN"),
            "true", StringComparison.OrdinalIgnoreCase);
        if (email is null && password is null && fullName is null && !promoteExisting) return;
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(fullName) || password.Length < 16 ||
            email.Length > 254 || fullName.Length > 120 ||
            !MailAddress.TryCreate(email, out var parsedEmail) ||
            !string.Equals(parsedEmail.Address, email.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Admin bootstrap environment settings are incomplete or invalid.");

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<HongBeautyDbContext>();
        var passwords = scope.ServiceProvider.GetRequiredService<IPasswordService>();
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var normalizedEmail = UserAccount.NormalizeEmail(email);
        if (promoteExisting)
        {
            var markerKey = "owner-promote-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalizedEmail)));
            if (await db.BootstrapMarkers.AnyAsync(x => x.Key == markerKey, cancellationToken)) return;
            var existing = await db.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken)
                ?? throw new InvalidOperationException("Owner promotion account was not found.");
            existing.PromoteToAdmin(passwords.Hash(password));
            db.BootstrapMarkers.Add(new BootstrapMarker(markerKey));
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation("One-time owner account promotion completed.");
            return;
        }
        if (await db.BootstrapMarkers.AnyAsync(x => x.Key == MarkerKey, cancellationToken)) return;

        if (!await db.Users.AnyAsync(x => x.Role == AccountRoles.Admin, cancellationToken))
        {
            var existing = await db.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken);
            if (existing is null) db.Users.Add(UserAccount.CreateBootstrapAdmin(fullName, email, passwords.Hash(password)));
            else existing.PromoteToAdmin(passwords.Hash(password));
        }

        db.BootstrapMarkers.Add(new BootstrapMarker(MarkerKey));
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            logger.LogInformation("Initial admin bootstrap marker committed.");
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Another instance committed the one-time marker first. This transaction rolls back.
            logger.LogInformation("Initial admin bootstrap already completed by another instance.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
