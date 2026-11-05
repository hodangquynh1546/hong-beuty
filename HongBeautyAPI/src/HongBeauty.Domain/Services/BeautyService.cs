namespace HongBeauty.Domain.Services;

public sealed class BeautyService
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int DurationMinutes { get; private set; }
    public string? ImageUrl { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private BeautyService() { }
    public BeautyService(string name, string slug, string description, decimal price, int durationMinutes, string? imageUrl, bool isActive)
        => Update(name, slug, description, price, durationMinutes, imageUrl, isActive);

    public void Update(string name, string slug, string description, decimal price, int durationMinutes, string? imageUrl, bool isActive)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(slug) || price < 0 || durationMinutes is < 1 or > 1440)
            throw new ArgumentException("Invalid service details.");
        Name = name.Trim(); Slug = slug.Trim(); Description = description.Trim(); Price = price;
        DurationMinutes = durationMinutes; ImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim(); IsActive = isActive;
    }

    public void Deactivate() => IsActive = false;
}
