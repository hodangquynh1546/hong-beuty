using HongBeauty.Application.Features.Products;
using HongBeauty.Domain.Products;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HongBeauty.Infrastructure.Features.Products;

public sealed class ProductCatalog(HongBeautyDbContext database) : IProductCatalog
{
    public async Task<IReadOnlyList<ProductDto>> ListAsync(string? search, Guid? categoryId, CancellationToken cancellationToken)
    {
        var products = database.Products.AsNoTracking().Where(x => x.IsActive &&
            (x.CategoryId == null || database.Categories.Any(c => c.Id == x.CategoryId && c.IsActive)));
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            products = products.Where(x => EF.Functions.ILike(x.Name, $"%{term}%"));
        }
        if (categoryId.HasValue) products = products.Where(x => x.CategoryId == categoryId.Value);
        return await ProjectProducts(products.OrderBy(x => x.Name)).ToListAsync(cancellationToken);
    }

    public Task<ProductDto?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        ProjectProducts(database.Products.AsNoTracking().Where(x => x.IsActive && x.Id == id &&
            (x.CategoryId == null || database.Categories.Any(c => c.Id == x.CategoryId && c.IsActive))))
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<CategoryDto>> ListCategoriesAsync(CancellationToken cancellationToken) =>
        await ProjectCategories(database.Categories.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<CategoryDto>> ListAdminCategoriesAsync(CancellationToken cancellationToken) =>
        await ProjectCategories(database.Categories.AsNoTracking().OrderBy(x => x.Name)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<AdminProductDto>> ListAdminProductsAsync(CancellationToken cancellationToken) =>
        await ProjectAdminProducts(database.Products.AsNoTracking().OrderBy(x => x.Name)).ToListAsync(cancellationToken);

    public async Task<CatalogWriteResponse<CategoryDto>> CreateCategoryAsync(CategoryInput input, CancellationToken cancellationToken)
    {
        var category = new Category(input.Name, input.Slug, input.Description);
        category.Update(input.Name, input.Slug, input.Description, input.IsActive);
        database.Categories.Add(category);
        if (!await SaveOrConflictAsync(cancellationToken)) return new(CatalogWriteResult.Conflict, null);
        return new(CatalogWriteResult.Success, Map(category));
    }

    public async Task<CatalogWriteResponse<CategoryDto>> UpdateCategoryAsync(Guid id, CategoryInput input, CancellationToken cancellationToken)
    {
        var category = await database.Categories.FindAsync([id], cancellationToken);
        if (category is null) return new(CatalogWriteResult.NotFound, null);
        category.Update(input.Name, input.Slug, input.Description, input.IsActive);
        if (!await SaveOrConflictAsync(cancellationToken)) return new(CatalogWriteResult.Conflict, null);
        return new(CatalogWriteResult.Success, Map(category));
    }

    public async Task<CatalogWriteResult> DeactivateCategoryAsync(Guid id, CancellationToken cancellationToken)
    {
        var category = await database.Categories.FindAsync([id], cancellationToken);
        if (category is null) return CatalogWriteResult.NotFound;
        category.Deactivate();
        await database.SaveChangesAsync(cancellationToken);
        return CatalogWriteResult.Success;
    }

    public async Task<CatalogWriteResponse<AdminProductDto>> CreateProductAsync(ProductInput input, CancellationToken cancellationToken)
    {
        if (!await CategoryValidAsync(input.CategoryId, cancellationToken)) return new(CatalogWriteResult.InvalidCategory, null);
        var product = new Product(input.Name, input.Slug, input.Description, input.Price, input.Stock);
        product.Update(input.CategoryId, input.Name, input.Slug, input.Description, input.Price,
            input.SalePrice, input.Stock, input.IsActive, input.ImageUrl, input.CostPrice);
        database.Products.Add(product);
        if (!await SaveOrConflictAsync(cancellationToken)) return new(CatalogWriteResult.Conflict, null);
        return new(CatalogWriteResult.Success, MapAdmin(product));
    }

    public async Task<CatalogWriteResponse<AdminProductDto>> UpdateProductAsync(Guid id, ProductInput input, CancellationToken cancellationToken)
    {
        var product = await database.Products.FindAsync([id], cancellationToken);
        if (product is null) return new(CatalogWriteResult.NotFound, null);
        if (!await CategoryValidAsync(input.CategoryId, cancellationToken)) return new(CatalogWriteResult.InvalidCategory, null);
        product.Update(input.CategoryId, input.Name, input.Slug, input.Description, input.Price,
            input.SalePrice, input.Stock, input.IsActive, input.ImageUrl, input.CostPrice);
        if (!await SaveOrConflictAsync(cancellationToken)) return new(CatalogWriteResult.Conflict, null);
        return new(CatalogWriteResult.Success, MapAdmin(product));
    }

    public async Task<CatalogWriteResult> DeactivateProductAsync(Guid id, CancellationToken cancellationToken)
    {
        var product = await database.Products.FindAsync([id], cancellationToken);
        if (product is null) return CatalogWriteResult.NotFound;
        product.Deactivate();
        await database.SaveChangesAsync(cancellationToken);
        return CatalogWriteResult.Success;
    }

    private Task<bool> CategoryValidAsync(Guid? id, CancellationToken cancellationToken) => id.HasValue
        ? database.Categories.AnyAsync(x => x.Id == id.Value && x.IsActive, cancellationToken)
        : Task.FromResult(true);

    private async Task<bool> SaveOrConflictAsync(CancellationToken cancellationToken)
    {
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return false;
        }
    }

    private static IQueryable<ProductDto> ProjectProducts(IQueryable<Product> query) =>
        query.Select(x => new ProductDto(x.Id, x.Name, x.Slug, x.Description, x.Price,
        x.SalePrice, x.Stock, x.CategoryId, x.IsActive, x.ImageUrl));

    private static IQueryable<AdminProductDto> ProjectAdminProducts(IQueryable<Product> query) =>
        query.Select(x => new AdminProductDto(x.Id, x.Name, x.Slug, x.Description, x.Price,
            x.SalePrice, x.CostPrice, x.Stock, x.CategoryId, x.IsActive, x.ImageUrl));

    private static IQueryable<CategoryDto> ProjectCategories(IQueryable<Category> query) =>
        query.Select(x => new CategoryDto(x.Id, x.Name, x.Slug, x.Description, x.IsActive));

    private static ProductDto Map(Product x) => new(x.Id, x.Name, x.Slug, x.Description,
        x.Price, x.SalePrice, x.Stock, x.CategoryId, x.IsActive, x.ImageUrl);

    private static AdminProductDto MapAdmin(Product x) => new(x.Id, x.Name, x.Slug, x.Description,
        x.Price, x.SalePrice, x.CostPrice, x.Stock, x.CategoryId, x.IsActive, x.ImageUrl);

    private static CategoryDto Map(Category x) => new(x.Id, x.Name, x.Slug, x.Description, x.IsActive);
}
