using System.Security.Claims;
using HongBeauty.Api.Authorization;
using HongBeauty.Domain.Support;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Api.Features.Support;

public sealed record SupportMessageInput(string Body);
public sealed record SupportConversationDto(Guid CustomerId, string CustomerName, string? LastMessage, DateTimeOffset? LastAt, int Unread);

[ApiController]
[Authorize]
[Route("api/v1/support")]
public sealed class SupportController(HongBeautyDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("messages")]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var items = await db.SupportMessages.AsNoTracking().Where(x => x.CustomerId == UserId)
            .OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync(ct);
        return Ok(items.OrderBy(x => x.CreatedAt));
    }

    [HttpPost("messages")]
    public async Task<IActionResult> Send(SupportMessageInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Body) || input.Body.Trim().Length > 2000)
            return BadRequest(new ProblemDetails { Title = "Tin nhắn phải có nội dung và tối đa 2.000 ký tự." });
        var message = new SupportMessage(UserId, false, input.Body);
        db.SupportMessages.Add(message);
        await db.SaveChangesAsync(ct);
        return Created($"/api/v1/support/messages/{message.Id}", message);
    }

    [HttpPost("read")]
    public async Task<IActionResult> Read(CancellationToken ct)
    {
        var unread = await db.SupportMessages.Where(x => x.CustomerId == UserId && x.FromAdmin && x.ReadAt == null).ToListAsync(ct);
        foreach (var message in unread) message.MarkRead();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/v1/admin/support")]
[RequirePermission("orders.manage")]
public sealed class AdminSupportController(HongBeautyDbContext db) : ControllerBase
{
    [HttpGet("conversations")]
    public async Task<IActionResult> Conversations(CancellationToken ct)
    {
        var conversations = await db.SupportMessages.AsNoTracking().GroupBy(x => x.CustomerId)
            .Select(g => new { CustomerId = g.Key, LastMessage = g.OrderByDescending(x => x.CreatedAt).Select(x => x.Body).FirstOrDefault(),
                LastAt = g.Max(x => x.CreatedAt), Unread = g.Count(x => !x.FromAdmin && x.ReadAt == null) })
            .ToListAsync(ct);
        var customerIds = conversations.Select(x => x.CustomerId).ToList();
        var customers = await db.Users.AsNoTracking().Where(x => customerIds.Contains(x.Id))
            .Select(x => new { x.Id, x.FullName }).ToDictionaryAsync(x => x.Id, x => x.FullName, ct);
        var result = conversations.Select(x => new SupportConversationDto(x.CustomerId,
            customers.GetValueOrDefault(x.CustomerId) ?? "Khách hàng", x.LastMessage, x.LastAt,
            x.Unread)).OrderByDescending(x => x.LastAt);
        return Ok(result);
    }

    [HttpGet("{customerId:guid}/messages")]
    public async Task<IActionResult> List(Guid customerId, CancellationToken ct)
    {
        var items = await db.SupportMessages.AsNoTracking().Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync(ct);
        return Ok(items.OrderBy(x => x.CreatedAt));
    }

    [HttpPost("{customerId:guid}/messages")]
    public async Task<IActionResult> Send(Guid customerId, SupportMessageInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Body) || input.Body.Trim().Length > 2000)
            return BadRequest(new ProblemDetails { Title = "Tin nhắn phải có nội dung và tối đa 2.000 ký tự." });
        if (!await db.Users.AnyAsync(x => x.Id == customerId, ct)) return NotFound();
        var message = new SupportMessage(customerId, true, input.Body);
        db.SupportMessages.Add(message);
        await db.SaveChangesAsync(ct);
        return Created($"/api/v1/admin/support/{customerId}/messages/{message.Id}", message);
    }

    [HttpPost("{customerId:guid}/read")]
    public async Task<IActionResult> Read(Guid customerId, CancellationToken ct)
    {
        var unread = await db.SupportMessages.Where(x => x.CustomerId == customerId && !x.FromAdmin && x.ReadAt == null).ToListAsync(ct);
        foreach (var message in unread) message.MarkRead();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
