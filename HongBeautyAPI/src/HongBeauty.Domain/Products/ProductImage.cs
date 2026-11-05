namespace HongBeauty.Domain.Products;

public sealed class ProductImage
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string ContentType { get; private set; } = string.Empty;
    public byte[] Data { get; private set; } = [];
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

    private ProductImage() { }

    public ProductImage(string contentType, byte[] data)
    {
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp") || data.Length is < 12 or > 2_000_000)
            throw new ArgumentException("Invalid product image.");
        ContentType = contentType;
        Data = data;
    }
}
