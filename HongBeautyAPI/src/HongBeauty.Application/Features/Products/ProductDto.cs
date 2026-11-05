namespace HongBeauty.Application.Features.Products;

public sealed record ProductDto(Guid Id, string Name, string Slug, string Description, decimal Price,
    decimal? SalePrice, int Stock, Guid? CategoryId, bool IsActive, string? ImageUrl);

public sealed record CategoryDto(Guid Id, string Name, string Slug, string Description, bool IsActive);

public sealed record CategoryInput(string Name, string Slug, string Description, bool IsActive = true);

public sealed record ProductInput(Guid? CategoryId, string Name, string Slug, string Description,
    decimal Price, decimal? SalePrice, int Stock, bool IsActive = true, string? ImageUrl = null);

public enum CatalogWriteResult { Success, NotFound, Conflict, InvalidCategory }

public sealed record CatalogWriteResponse<T>(CatalogWriteResult Result, T? Value);

public interface IProductCatalog
{
    Task<IReadOnlyList<ProductDto>> ListAsync(string? search, Guid? categoryId, CancellationToken cancellationToken);
    Task<ProductDto?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<CategoryDto>> ListCategoriesAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<CategoryDto>> ListAdminCategoriesAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<ProductDto>> ListAdminProductsAsync(CancellationToken cancellationToken);
    Task<CatalogWriteResponse<CategoryDto>> CreateCategoryAsync(CategoryInput input, CancellationToken cancellationToken);
    Task<CatalogWriteResponse<CategoryDto>> UpdateCategoryAsync(Guid id, CategoryInput input, CancellationToken cancellationToken);
    Task<CatalogWriteResult> DeactivateCategoryAsync(Guid id, CancellationToken cancellationToken);
    Task<CatalogWriteResponse<ProductDto>> CreateProductAsync(ProductInput input, CancellationToken cancellationToken);
    Task<CatalogWriteResponse<ProductDto>> UpdateProductAsync(Guid id, ProductInput input, CancellationToken cancellationToken);
    Task<CatalogWriteResult> DeactivateProductAsync(Guid id, CancellationToken cancellationToken);
}
