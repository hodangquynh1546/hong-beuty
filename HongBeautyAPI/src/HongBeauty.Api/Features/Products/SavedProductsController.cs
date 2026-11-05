using System.Security.Claims;
using HongBeauty.Domain.Products;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HongBeauty.Api.Features.Products;

[ApiController]
[Authorize]
[Route("api/v1/saved-products")]
public sealed class SavedProductsController(HongBeautyDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await db.SavedProducts.AsNoTracking()
        .Where(x => x.UserId == UserId && db.Products.Any(p => p.Id == x.ProductId && p.IsActive))
        .OrderByDescending(x => x.CreatedAt).Select(x => x.ProductId).ToListAsync(ct));

    [HttpPut("{productId:guid}")]
    public async Task<IActionResult> Save(Guid productId, CancellationToken ct)
    {
        if (!await db.Products.AnyAsync(x => x.Id == productId && x.IsActive, ct)) return NotFound();
        if (await db.SavedProducts.AnyAsync(x => x.UserId == UserId && x.ProductId == productId, ct)) return NoContent();
        db.SavedProducts.Add(new SavedProduct(UserId, productId));
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation }) { }
        return NoContent();
    }

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> Remove(Guid productId, CancellationToken ct)
    {
        var saved = await db.SavedProducts.FindAsync([UserId, productId], ct);
        if (saved is null) return NoContent();
        db.SavedProducts.Remove(saved);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
