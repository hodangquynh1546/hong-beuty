using System.Data;
using System.Security.Claims;
using HongBeauty.Api.Authorization;
using HongBeauty.Domain.Services;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HongBeauty.Api.Features.Services;

public sealed record BookAppointmentRequest(Guid ServiceId, DateTimeOffset StartsAt);
public sealed record AppointmentStatusRequest(string Status);
public sealed record AdminAppointmentDto(Guid Id, Guid UserId, Guid ServiceId, string ServiceName,
    decimal Price, DateTimeOffset StartsAt, DateTimeOffset EndsAt, string Status, string CustomerName, string CustomerEmail);

[ApiController]
[Authorize]
[Route("api/v1/appointments")]
public sealed class AppointmentsController(HongBeautyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<BeautyAppointment>> Mine(CancellationToken ct) =>
        await db.BeautyAppointments.AsNoTracking().Where(x => x.UserId == UserId)
            .OrderByDescending(x => x.StartsAt).Take(100).ToListAsync(ct);

    [HttpPost]
    public async Task<IActionResult> Book(BookAppointmentRequest request, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        if (request.ServiceId == Guid.Empty ||
            request.StartsAt <= now.AddMinutes(30) || request.StartsAt > now.AddDays(90))
            return BadRequest(new ProblemDetails { Title = "Chọn giờ hẹn hợp lệ trong 90 ngày tới." });
        try
        {
            await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
            var service = await db.BeautyServices.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.ServiceId && x.IsActive, ct);
            if (service is null) return NotFound();
            var appointment = new BeautyAppointment(UserId, service, request.StartsAt);
            var occupied = await db.BeautyAppointments.AnyAsync(x => x.ServiceId == service.Id &&
                x.Status != AppointmentStatuses.Cancelled && x.StartsAt < appointment.EndsAt && x.EndsAt > appointment.StartsAt, ct);
            if (occupied) return Conflict(new ProblemDetails { Title = "Khung giờ này đã có lịch. Vui lòng chọn giờ khác." });
            db.BeautyAppointments.Add(appointment);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Created($"/api/v1/appointments/{appointment.Id}", appointment);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.SerializationFailure)
        { return Conflict(new ProblemDetails { Title = "Khung giờ vừa được đặt. Vui lòng thử giờ khác." }); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.SerializationFailure })
        { return Conflict(new ProblemDetails { Title = "Khung giờ vừa được đặt. Vui lòng thử giờ khác." }); }
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var appointment = await db.BeautyAppointments.FirstOrDefaultAsync(x => x.Id == id && x.UserId == UserId, ct);
        if (appointment is null) return NotFound();
        if (appointment.StartsAt <= DateTimeOffset.UtcNow) return Conflict(new ProblemDetails { Title = "Không thể hủy lịch đã bắt đầu." });
        try { appointment.SetStatus(AppointmentStatuses.Cancelled); }
        catch (InvalidOperationException) { return Conflict(new ProblemDetails { Title = "Không thể hủy lịch này." }); }
        await db.SaveChangesAsync(ct);
        return Ok(appointment);
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Route("api/v1/admin/appointments")]
[RequirePermission("catalog.write")]
public sealed class AdminAppointmentsController(HongBeautyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<AdminAppointmentDto>> List(CancellationToken ct) =>
        await (from appointment in db.BeautyAppointments.AsNoTracking()
               join customer in db.Users.AsNoTracking() on appointment.UserId equals customer.Id
               orderby appointment.StartsAt descending
               select new AdminAppointmentDto(appointment.Id, appointment.UserId, appointment.ServiceId,
                   appointment.ServiceName, appointment.Price, appointment.StartsAt, appointment.EndsAt,
                   appointment.Status, customer.FullName, customer.Email)).Take(200).ToListAsync(ct);

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, AppointmentStatusRequest request, CancellationToken ct)
    {
        if (request.Status is not (AppointmentStatuses.Confirmed or AppointmentStatuses.Completed or AppointmentStatuses.Cancelled))
            return BadRequest();
        var appointment = await db.BeautyAppointments.FindAsync([id], ct);
        if (appointment is null) return NotFound();
        try { appointment.SetStatus(request.Status); }
        catch (InvalidOperationException) { return Conflict(new ProblemDetails { Title = "Không thể đổi trạng thái lịch này." }); }
        await db.SaveChangesAsync(ct);
        var customer = await db.Users.AsNoTracking().FirstAsync(x => x.Id == appointment.UserId, ct);
        return Ok(new AdminAppointmentDto(appointment.Id, appointment.UserId, appointment.ServiceId,
            appointment.ServiceName, appointment.Price, appointment.StartsAt, appointment.EndsAt,
            appointment.Status, customer.FullName, customer.Email));
    }
}
