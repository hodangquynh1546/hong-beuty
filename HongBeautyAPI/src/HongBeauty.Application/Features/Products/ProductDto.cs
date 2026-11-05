namespace HongBeauty.Application.Features.Products;

public sealed record ProductDto(Guid Id, string Name, string Slug, string Description, decimal Price, decimal? SalePrice, int Stock);

public interface IProductCatalog
{
    Task<IReadOnlyList<ProductDto>> ListAsync(string? search, CancellationToken cancellationToken);
    Task<ProductDto?> GetAsync(Guid id, CancellationToken cancellationToken);
}
