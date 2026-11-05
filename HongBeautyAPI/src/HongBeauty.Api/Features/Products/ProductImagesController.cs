using HongBeauty.Api.Authorization;
using HongBeauty.Domain.Products;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Api.Features.Products;

[ApiController]
[Route("api/v1/product-images")]
public sealed class ProductImagesController(HongBeautyDbContext db) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var image = await db.ProductImages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (image is null) return NotFound();
        Response.Headers.CacheControl = "public, max-age=86400, immutable";
        return File(image.Data, image.ContentType);
    }

    [HttpPost]
    [RequirePermission("catalog.write")]
    [RequestSizeLimit(2_100_000)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file.Length is < 12 or > 2_000_000)
            return BadRequest(new ProblemDetails { Title = "Ảnh phải nhỏ hơn 2 MB." });
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, ct);
        var data = stream.ToArray();
        var type = DetectContentType(data);
        if (type is null) return BadRequest(new ProblemDetails { Title = "Chỉ nhận ảnh JPG, PNG hoặc WebP." });
        var image = new ProductImage(type, data);
        db.ProductImages.Add(image);
        await db.SaveChangesAsync(ct);
        var url = $"/api/v1/product-images/{image.Id}";
        return Created(url, new { url });
    }

    private static string? DetectContentType(byte[] data)
    {
        if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) return "image/jpeg";
        if (data.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (data.AsSpan(0, 4).SequenceEqual("RIFF"u8) && data.AsSpan(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
}
