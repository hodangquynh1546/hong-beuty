namespace HongBeauty.Api.Middleware;

public sealed class SameOriginMiddleware(RequestDelegate next, IConfiguration configuration)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method) ||
            HttpMethods.IsOptions(context.Request.Method) || HttpMethods.IsTrace(context.Request.Method))
        {
            await next(context);
            return;
        }

        var origin = context.Request.Headers.Origin.ToString();
        var allowedOrigins = configuration.GetSection("Security:AllowedOrigins").Get<string[]>() ?? [];
        if (!string.IsNullOrEmpty(origin) &&
            (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
             !(string.Equals(uri.Scheme, context.Request.Scheme, StringComparison.OrdinalIgnoreCase) &&
               string.Equals(uri.Authority, context.Request.Host.Value, StringComparison.OrdinalIgnoreCase)) &&
             !allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }

        await next(context);
    }
}
