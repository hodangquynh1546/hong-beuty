using FluentValidation;
using HongBeauty.Api.Authorization;
using HongBeauty.Application.Features.Products;
using Microsoft.AspNetCore.Mvc;

namespace HongBeauty.Api.Features.Products;

[ApiController]
[Route("api/v1/admin/categories")]
[RequirePermission("catalog.write")]
public sealed class AdminCategoriesController(IProductCatalog catalog, IValidator<CategoryInput> validator) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<CategoryDto>> List(CancellationToken cancellationToken) => catalog.ListAdminCategoriesAsync(cancellationToken);

    [HttpPost]
    public async Task<IActionResult> Create(CategoryInput input, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return BadRequest(new ValidationProblemDetails(validation.ToDictionary()));
        var result = await catalog.CreateCategoryAsync(input, cancellationToken);
        return result.Result == CatalogWriteResult.Conflict ? Conflict(new ProblemDetails { Title = "Slug already exists." })
            : Created($"/api/v1/admin/categories/{result.Value!.Id}", result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CategoryInput input, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return BadRequest(new ValidationProblemDetails(validation.ToDictionary()));
        var result = await catalog.UpdateCategoryAsync(id, input, cancellationToken);
        return result.Result switch
        {
            CatalogWriteResult.NotFound => NotFound(),
            CatalogWriteResult.Conflict => Conflict(new ProblemDetails { Title = "Slug already exists." }),
            _ => Ok(result.Value)
        };
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken) =>
        await catalog.DeactivateCategoryAsync(id, cancellationToken) == CatalogWriteResult.NotFound ? NotFound() : NoContent();
}

[ApiController]
[Route("api/v1/admin/products")]
[RequirePermission("catalog.write")]
public sealed class AdminProductsController(IProductCatalog catalog, IValidator<ProductInput> validator) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<ProductDto>> List(CancellationToken cancellationToken) => catalog.ListAdminProductsAsync(cancellationToken);

    [HttpPost]
    public async Task<IActionResult> Create(ProductInput input, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return BadRequest(new ValidationProblemDetails(validation.ToDictionary()));
        var result = await catalog.CreateProductAsync(input, cancellationToken);
        return result.Result switch
        {
            CatalogWriteResult.InvalidCategory => BadRequest(new ProblemDetails { Title = "Category is missing or inactive." }),
            CatalogWriteResult.Conflict => Conflict(new ProblemDetails { Title = "Slug already exists." }),
            _ => Created($"/api/v1/admin/products/{result.Value!.Id}", result.Value)
        };
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, ProductInput input, CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return BadRequest(new ValidationProblemDetails(validation.ToDictionary()));
        var result = await catalog.UpdateProductAsync(id, input, cancellationToken);
        return result.Result switch
        {
            CatalogWriteResult.NotFound => NotFound(),
            CatalogWriteResult.InvalidCategory => BadRequest(new ProblemDetails { Title = "Category is missing or inactive." }),
            CatalogWriteResult.Conflict => Conflict(new ProblemDetails { Title = "Slug already exists." }),
            _ => Ok(result.Value)
        };
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken) =>
        await catalog.DeactivateProductAsync(id, cancellationToken) == CatalogWriteResult.NotFound ? NotFound() : NoContent();
}
