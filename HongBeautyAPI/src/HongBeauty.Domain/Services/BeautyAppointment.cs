namespace HongBeauty.Domain.Services;

public static class AppointmentStatuses
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public sealed class BeautyAppointment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public Guid ServiceId { get; private set; }
    public string ServiceName { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }
    public string Status { get; private set; } = AppointmentStatuses.Pending;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private BeautyAppointment() { }
    public BeautyAppointment(Guid userId, BeautyService service, DateTimeOffset startsAt)
    {
        UserId = userId; ServiceId = service.Id; ServiceName = service.Name; Price = service.Price;
        StartsAt = startsAt.ToUniversalTime(); EndsAt = StartsAt.AddMinutes(service.DurationMinutes);
    }
    public void SetStatus(string status)
    {
        var allowed = Status switch
        {
            AppointmentStatuses.Pending => status is AppointmentStatuses.Confirmed or AppointmentStatuses.Cancelled,
            AppointmentStatuses.Confirmed => status is AppointmentStatuses.Completed or AppointmentStatuses.Cancelled,
            _ => false
        };
        if (!allowed) throw new InvalidOperationException("Invalid appointment transition.");
        Status = status;
    }
}
