using HongBeauty.Application.Features.Products;
using Microsoft.AspNetCore.Mvc;

namespace HongBeauty.Api.Features.Products;

[ApiController]
[Route("api/v1/products")]
public sealed class ProductsController(IProductCatalog catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> List([FromQuery] string? search, [FromQuery] Guid? categoryId, CancellationToken cancellationToken)
    {
        if (search?.Length > 100) return BadRequest(new { error = "Search term is too long." });
        return Ok(await catalog.ListAsync(search, categoryId, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var product = await catalog.GetAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }
}

[ApiController]
[Route("api/v1/categories")]
public sealed class CategoriesController(IProductCatalog catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> List(CancellationToken cancellationToken) =>
        Ok(await catalog.ListCategoriesAsync(cancellationToken));
}
