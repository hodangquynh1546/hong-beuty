namespace HongBeauty.Domain.Users;

public sealed class BootstrapMarker
{
    public string Key { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private BootstrapMarker() { }

    public BootstrapMarker(string key) => Key = key;
}
