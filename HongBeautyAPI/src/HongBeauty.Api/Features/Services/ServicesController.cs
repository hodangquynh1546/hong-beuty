using HongBeauty.Api.Authorization;
using HongBeauty.Domain.Services;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HongBeauty.Api.Features.Services;

public sealed record ServiceInput(string Name, string Slug, string Description, decimal Price,
    int DurationMinutes, string? ImageUrl, bool IsActive);

[ApiController]
[Route("api/v1/services")]
public sealed class ServicesController(HongBeautyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<BeautyService>> List(CancellationToken ct) =>
        await db.BeautyServices.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync(ct);
}

[ApiController]
[Route("api/v1/admin/services")]
[RequirePermission("catalog.write")]
public sealed class AdminServicesController(HongBeautyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<BeautyService>> List(CancellationToken ct) =>
        await db.BeautyServices.AsNoTracking().OrderBy(x => x.Name).ToListAsync(ct);

    [HttpPost]
    public async Task<IActionResult> Create(ServiceInput input, CancellationToken ct)
    {
        if (!Valid(input)) return BadRequest(new ProblemDetails { Title = "Thông tin dịch vụ chưa hợp lệ." });
        var service = new BeautyService(input.Name, input.Slug, input.Description, input.Price,
            input.DurationMinutes, input.ImageUrl, input.IsActive);
        db.BeautyServices.Add(service);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        { return Conflict(new ProblemDetails { Title = "Đường dẫn đã tồn tại." }); }
        return Created($"/api/v1/admin/services/{service.Id}", service);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, ServiceInput input, CancellationToken ct)
    {
        if (!Valid(input)) return BadRequest(new ProblemDetails { Title = "Thông tin dịch vụ chưa hợp lệ." });
        var service = await db.BeautyServices.FindAsync([id], ct);
        if (service is null) return NotFound();
        service.Update(input.Name, input.Slug, input.Description, input.Price,
            input.DurationMinutes, input.ImageUrl, input.IsActive);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        { return Conflict(new ProblemDetails { Title = "Đường dẫn đã tồn tại." }); }
        return Ok(service);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Hide(Guid id, CancellationToken ct)
    {
        var service = await db.BeautyServices.FindAsync([id], ct);
        if (service is null) return NotFound();
        service.Deactivate();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static bool Valid(ServiceInput x) =>
        !string.IsNullOrWhiteSpace(x.Name) && x.Name.Length <= 180 &&
        !string.IsNullOrWhiteSpace(x.Slug) && x.Slug.Length <= 200 &&
        System.Text.RegularExpressions.Regex.IsMatch(x.Slug, "^[a-z0-9]+(?:-[a-z0-9]+)*$") &&
        x.Description is not null && x.Description.Length <= 5000 &&
        x.Price is >= 0 and <= 9999999999999999m && x.DurationMinutes is >= 1 and <= 1440 &&
        (x.ImageUrl is null || (x.ImageUrl.Length <= 2048 &&
          (x.ImageUrl.StartsWith("/api/v1/product-images/", StringComparison.Ordinal) ||
           (Uri.TryCreate(x.ImageUrl, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps))));
}
