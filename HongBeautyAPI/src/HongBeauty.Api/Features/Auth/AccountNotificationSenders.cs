using System.Net;
using System.Net.Mail;
using System.Text;
using HongBeauty.Application.Features.Auth;

namespace HongBeauty.Api.Features.Auth;

// Development only: messages are written to a local file with restrictive permissions.
public sealed class DevelopmentOutboxNotificationSender(IWebHostEnvironment environment, ILogger<DevelopmentOutboxNotificationSender> logger) : IAccountNotificationSender
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private readonly string _path = Path.Combine(Path.GetTempPath(), $"hongbeauty-development-auth-outbox-{Guid.NewGuid():N}.txt");

    public Task SendVerificationAsync(string email, string token, CancellationToken cancellationToken) =>
        WriteAsync($"VERIFY {email} {token}", cancellationToken);

    public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken) =>
        WriteAsync($"RESET {email} {token}", cancellationToken);

    private async Task WriteAsync(string message, CancellationToken cancellationToken)
    {
        if (!environment.IsDevelopment()) throw new InvalidOperationException("Development outbox is disabled.");
        await Gate.WaitAsync(cancellationToken);
        try
        {
            var firstWrite = !File.Exists(_path);
            var options = new FileStreamOptions
            {
                Mode = firstWrite ? FileMode.CreateNew : FileMode.Append,
                Access = FileAccess.Write,
                Share = FileShare.None,
                Options = FileOptions.Asynchronous
            };
            if (OperatingSystem.IsLinux() || OperatingSystem.IsMacOS())
                options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
            await using var stream = new FileStream(_path, options);
            if (firstWrite) logger.LogInformation("Development auth outbox: {Path}", _path);
            var bytes = Encoding.UTF8.GetBytes($"{DateTimeOffset.UtcNow:O} {message}{Environment.NewLine}");
            await stream.WriteAsync(bytes, cancellationToken);
        }
        finally { Gate.Release(); }
    }
}

public sealed class SmtpAccountNotificationSender(IConfiguration configuration) : IAccountNotificationSender
{
    public Task SendVerificationAsync(string email, string token, CancellationToken cancellationToken) =>
        SendAsync(email, "Xác nhận email Hong Beauty", "verify-email", token, cancellationToken);

    public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken) =>
        SendAsync(email, "Đặt lại mật khẩu Hong Beauty", "reset-password", token, cancellationToken);

    private async Task SendAsync(string email, string subject, string path, string token, CancellationToken cancellationToken)
    {
        var host = configuration["AccountEmail:SmtpHost"];
        var from = configuration["AccountEmail:From"];
        var baseUrl = configuration["AccountEmail:BaseUrl"];
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from) ||
            !Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new NotificationNotConfiguredException();

        var port = configuration.GetValue<int?>("AccountEmail:SmtpPort") ?? 587;
        var username = configuration["AccountEmail:SmtpUsername"];
        var password = configuration["AccountEmail:SmtpPassword"];
        using var client = new SmtpClient(host, port) { EnableSsl = true };
        if (!string.IsNullOrEmpty(username)) client.Credentials = new NetworkCredential(username, password);
        using var message = new MailMessage(from, email)
        {
            Subject = subject,
            Body = $"Mở liên kết để tiếp tục: {baseUrl!.TrimEnd('/')}/{path}?token={Uri.EscapeDataString(token)}"
        };
        await client.SendMailAsync(message, cancellationToken);
    }
}
