using HongBeauty.Application.Features.Products;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Infrastructure.Features.Products;

public sealed class ProductCatalog(HongBeautyDbContext database) : IProductCatalog
{
    public async Task<IReadOnlyList<ProductDto>> ListAsync(string? search, CancellationToken cancellationToken)
    {
        var products = database.Products.AsNoTracking().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            products = products.Where(x => EF.Functions.ILike(x.Name, $"%{term}%"));
        }
        return await products.OrderBy(x => x.Name)
            .Select(x => new ProductDto(x.Id, x.Name, x.Slug, x.Description, x.Price, x.SalePrice, x.Stock))
            .ToListAsync(cancellationToken);
    }

    public Task<ProductDto?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        database.Products.AsNoTracking().Where(x => x.IsActive && x.Id == id)
            .Select(x => new ProductDto(x.Id, x.Name, x.Slug, x.Description, x.Price, x.SalePrice, x.Stock))
            .FirstOrDefaultAsync(cancellationToken);
}
