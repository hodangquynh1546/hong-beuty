using HongBeauty.Application.Features.Products;
using Microsoft.AspNetCore.Mvc;

namespace HongBeauty.Api.Features.Products;

[ApiController]
[Route("api/v1/products")]
public sealed class ProductsController(IProductCatalog catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> List([FromQuery] string? search, CancellationToken cancellationToken)
    {
        if (search?.Length > 100) return BadRequest(new { error = "Search term is too long." });
        return Ok(await catalog.ListAsync(search, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var product = await catalog.GetAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }
}
