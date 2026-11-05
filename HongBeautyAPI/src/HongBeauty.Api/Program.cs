using HongBeauty.Api.Middleware;
using HongBeauty.Api.Authorization;
using HongBeauty.Api.Features.Auth;
using HongBeauty.Application.Features.Auth;
using HongBeauty.Application.Features.Products;
using HongBeauty.Infrastructure.Features.Auth;
using HongBeauty.Infrastructure.Features.Products;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Serilog;
using Serilog.Formatting.Compact;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentName()
    .WriteTo.Async(sink => sink.Console(new RenderedCompactJsonFormatter())));

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");

builder.Services.AddDbContext<HongBeautyDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IProductCatalog, ProductCatalog>();
builder.Services.AddScoped<IUserAccountStore, UserAccountStore>();
builder.Services.AddScoped<IAuthActionStore, AuthActionStore>();
builder.Services.AddSingleton<IPasswordService, Pbkdf2PasswordService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuthLifecycleService>();
if (builder.Environment.IsDevelopment())
    builder.Services.AddSingleton<IAccountNotificationSender, DevelopmentOutboxNotificationSender>();
else
    builder.Services.AddSingleton<IAccountNotificationSender, SmtpAccountNotificationSender>();
builder.Services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();
builder.Services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "hongbeauty.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
        options.Events.OnValidatePrincipal = async context =>
        {
            var idValue = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var stampValue = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Sid)?.Value;
            var store = context.HttpContext.RequestServices.GetRequiredService<IUserAccountStore>();
            var user = Guid.TryParse(idValue, out var id) ? await store.FindByIdAsync(id, context.HttpContext.RequestAborted) : null;
            if (user is null || user.SecurityStamp.ToString() != stampValue)
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
});
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new Asp.Versioning.ApiVersion(1, 0);
    options.ApiVersionReader = new Asp.Versioning.QueryStringApiVersionReader();
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
}).AddMvc().AddApiExplorer();

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<SameOriginMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
if (Directory.Exists(Path.Combine(app.Environment.ContentRootPath, "wwwroot")))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");
}
app.Run();

public partial class Program;
