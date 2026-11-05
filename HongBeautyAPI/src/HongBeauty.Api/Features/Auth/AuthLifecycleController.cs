using System.Security.Claims;
using FluentValidation;
using HongBeauty.Application.Features.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HongBeauty.Api.Features.Auth;

public sealed record TokenRequest(string Token);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Token, string NewPassword);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthLifecycleController(AuthLifecycleService lifecycle, ILogger<AuthLifecycleController> logger) : ControllerBase
{
    [HttpPost("verification/request")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> RequestVerification(CancellationToken cancellationToken)
    {
        try
        {
            await lifecycle.RequestVerificationAsync(CurrentUserId(), cancellationToken);
            return Accepted();
        }
        catch (NotificationNotConfiguredException) { return StatusCode(503, new ProblemDetails { Title = "Dịch vụ gửi email chưa được cấu hình." }); }
        catch (NotificationDeliveryException) { return StatusCode(503, new ProblemDetails { Title = "Chưa gửi được email. Vui lòng thử lại sau." }); }
    }

    [HttpPost("verification/confirm")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ConfirmVerification(TokenRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || request.Token.Length > 256) return BadRequest();
        return await lifecycle.ConfirmVerificationAsync(request.Token, cancellationToken) ? NoContent() : BadRequest();
    }

    [HttpPost("password/forgot")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 254) return BadRequest();
        try
        {
            await lifecycle.RequestPasswordResetAsync(request.Email, cancellationToken);
            return Accepted();
        }
        catch (NotificationNotConfiguredException)
        {
            logger.LogError("Password reset notification is not configured.");
            return Accepted();
        }
        catch (NotificationDeliveryException)
        {
            logger.LogError("Password reset notification delivery failed.");
            return Accepted();
        }
    }

    [HttpPost("password/reset")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || request.Token.Length > 256 ||
            string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length is < 12 or > 128)
            return BadRequest();
        return await lifecycle.ResetPasswordAsync(request.Token, request.NewPassword, cancellationToken)
            ? NoContent() : BadRequest();
    }

    [HttpPost("password/change")]
    [Authorize]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length is < 12 or > 128)
            return BadRequest();
        if (!await lifecycle.ChangePasswordAsync(CurrentUserId(), request.CurrentPassword, request.NewPassword, cancellationToken))
            return BadRequest();
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private Guid CurrentUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
