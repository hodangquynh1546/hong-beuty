using System.Security.Claims;
using FluentValidation;
using HongBeauty.Application.Features.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HongBeauty.Api.Features.Auth;

public sealed record RegisterRequest(string FullName, string Email, string Password);
public sealed record LoginRequest(string Email, string Password, bool RememberMe = false);
public sealed record UpdateProfileRequest(string FullName);

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(12).MaximumLength(128);
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(
    AuthService auth,
    IUserAccountStore users,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthUserDto>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var validation = await registerValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return BadRequest(new ValidationProblemDetails(validation.ToDictionary()));

        try
        {
            var user = await auth.RegisterAsync(request.FullName, request.Email, request.Password, cancellationToken);
            await SignInAsync(user);
            return Created("/api/v1/auth/me", user);
        }
        catch (DuplicateEmailException)
        {
            return Conflict(new ProblemDetails { Status = 409, Title = "Email đã được đăng ký." });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthUserDto>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var validation = await loginValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return BadRequest(new ValidationProblemDetails(validation.ToDictionary()));

        var user = await auth.LoginAsync(request.Email, request.Password, cancellationToken);
        if (user is null) return Unauthorized(new ProblemDetails { Status = 401, Title = "Email hoặc mật khẩu không đúng." });
        await SignInAsync(user, request.RememberMe);
        return Ok(user);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken cancellationToken)
    {
        var rawId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(rawId, out var id)) return Unauthorized();
        var user = await auth.GetByIdAsync(id, cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    [HttpPatch("profile")]
    [Authorize]
    public async Task<ActionResult<AuthUserDto>> UpdateProfile(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 120)
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> {
                ["fullName"] = ["Họ tên phải có từ 1 đến 120 ký tự."]
            }));
        var rawId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(rawId, out var id)) return Unauthorized();
        var user = await auth.UpdateProfileAsync(id, request.FullName, cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    private async Task SignInAsync(AuthUserDto user, bool rememberMe = false)
    {
        var account = await users.FindByIdAsync(user.Id, HttpContext.RequestAborted)
            ?? throw new InvalidOperationException("Account disappeared after authentication.");
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim(ClaimTypes.Sid, account.SecurityStamp.ToString())],
            CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal,
            new AuthenticationProperties { IsPersistent = rememberMe });
    }
}
