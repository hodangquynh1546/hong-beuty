using HongBeauty.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Api.Features.Health;

[ApiController]
[Route("api/v1/health")]
public sealed class HealthController(HongBeautyDbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var connected = await database.Database.CanConnectAsync(cancellationToken);
        return connected ? Ok(new { status = "healthy", database = "connected" })
            : StatusCode(503, new { status = "degraded", database = "unavailable" });
    }
}
