namespace HongBeauty.Domain.Products;

public sealed class Category
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private Category() { }

    public Category(string name, string slug, string description) => Update(name, slug, description, true);

    public void Update(string name, string slug, string description, bool isActive)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Category name and slug are required.");
        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Description = description.Trim();
        IsActive = isActive;
    }

    public void Deactivate() => IsActive = false;
}
