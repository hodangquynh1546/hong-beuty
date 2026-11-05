using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace HongBeauty.Infrastructure.Persistence;

public sealed class HongBeautyDesignTimeDbContextFactory : IDesignTimeDbContextFactory<HongBeautyDbContext>
{
    public HongBeautyDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=localhost;Database=hongbeauty;Username=hongbeauty";
        var options = new DbContextOptionsBuilder<HongBeautyDbContext>().UseNpgsql(connectionString).Options;
        return new HongBeautyDbContext(options);
    }
}
