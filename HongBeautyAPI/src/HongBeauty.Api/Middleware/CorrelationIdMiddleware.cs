namespace HongBeauty.Api.Middleware;

public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var id = context.Request.Headers.TryGetValue("X-Correlation-ID", out var incoming)
            && Guid.TryParse(incoming.ToString(), out var parsed) ? parsed : Guid.NewGuid();
        context.TraceIdentifier = id.ToString();
        context.Response.Headers["X-Correlation-ID"] = context.TraceIdentifier;
        await next(context);
    }
}
