using HongBeauty.Domain.Services;

namespace HongBeauty.UnitTests;

public sealed class AppointmentTests
{
    [Fact]
    public void Appointment_SnapshotsService_AndEnforcesStatusTransitions()
    {
        var service = new BeautyService("Chăm sóc da", "cham-soc-da", "", 350000m, 75, null, true);
        var appointment = new BeautyAppointment(Guid.NewGuid(), service, DateTimeOffset.UtcNow.AddDays(2));
        Assert.Equal(service.Name, appointment.ServiceName);
        Assert.Equal(service.Price, appointment.Price);
        Assert.Equal(75, (appointment.EndsAt - appointment.StartsAt).TotalMinutes);

        appointment.SetStatus(AppointmentStatuses.Confirmed);
        appointment.SetStatus(AppointmentStatuses.Completed);
        Assert.Throws<InvalidOperationException>(() => appointment.SetStatus(AppointmentStatuses.Cancelled));
    }
}
