using System.Security.Claims;
using FluentValidation;
using HongBeauty.Api.Authorization;
using HongBeauty.Application.Features.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HongBeauty.Api.Features.Orders;

public sealed record CartQuantityRequest(int Quantity);
public sealed record CheckoutRequest(Guid AddressId);
public sealed record OrderStatusRequest(string Status);

public sealed class AddressInputValidator : AbstractValidator<AddressInput>
{
    public AddressInputValidator()
    {
        RuleFor(x => x.Recipient).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Phone).Matches(@"^\+?[0-9]{9,15}$");
        RuleFor(x => x.Line1).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Ward).NotEmpty().MaximumLength(100);
        RuleFor(x => x.District).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Province).NotEmpty().MaximumLength(100);
    }
}

[ApiController]
[Authorize]
[Route("api/v1/cart")]
public sealed class CartController(ICommerceStore store) : ControllerBase
{
    [HttpGet]
    public Task<CartDto> Get(CancellationToken ct) => store.GetCartAsync(UserId, ct);

    [HttpPut("items/{productId:guid}")]
    public async Task<IActionResult> SetItem(Guid productId, CartQuantityRequest request, CancellationToken ct)
    {
        if (request.Quantity is < 0 or > 99) return BadRequest(new ProblemDetails { Title = "Quantity must be between 0 and 99." });
        try { return Ok(await store.SetCartItemAsync(UserId, productId, request.Quantity, ct)); }
        catch (CommerceNotFoundException) { return NotFound(); }
        catch (CommerceConflictException ex) { return Conflict(new ProblemDetails { Title = ex.Message }); }
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Authorize]
[Route("api/v1/addresses")]
public sealed class AddressesController(ICommerceStore store, IValidator<AddressInput> validator) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<AddressDto>> List(CancellationToken ct) => store.GetAddressesAsync(UserId, ct);

    [HttpPost]
    public async Task<IActionResult> Add(AddressInput input, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(input, ct);
        if (!result.IsValid) return BadRequest(new ValidationProblemDetails(result.ToDictionary()));
        var address = await store.AddAddressAsync(UserId, input, ct);
        return Created($"/api/v1/addresses/{address.Id}", address);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { return await store.DeleteAddressAsync(UserId, id, ct) ? NoContent() : NotFound(); }
        catch (CommerceConflictException ex) { return Conflict(new ProblemDetails { Title = ex.Message }); }
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Authorize]
[Route("api/v1/orders")]
public sealed class OrdersController(ICommerceStore store) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Checkout(CheckoutRequest request, CancellationToken ct)
    {
        if (request.AddressId == Guid.Empty) return BadRequest(new ProblemDetails { Title = "Address is required." });
        try
        {
            var order = await store.CheckoutAsync(UserId, request.AddressId, ct);
            return Created($"/api/v1/orders/{order.Id}", order);
        }
        catch (CommerceNotFoundException) { return NotFound(); }
        catch (CommerceConflictException ex) { return Conflict(new ProblemDetails { Title = ex.Message }); }
    }

    [HttpGet]
    public Task<IReadOnlyList<OrderDto>> List(CancellationToken ct) => store.GetOrdersAsync(UserId, ct);

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) =>
        await store.GetOrderAsync(UserId, id, ct) is { } order ? Ok(order) : NotFound();

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        try { return await store.CancelOrderAsync(UserId, id, ct) is { } order ? Ok(order) : NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Title = ex.Message }); }
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

[ApiController]
[Route("api/v1/admin/orders")]
[RequirePermission("orders.manage")]
public sealed class AdminOrdersController(ICommerceStore store) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<OrderDto>> List(CancellationToken ct) => store.GetAdminOrdersAsync(ct);

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetStatus(Guid id, OrderStatusRequest request, CancellationToken ct)
    {
        if (request.Status is not ("Confirmed" or "Shipped" or "Completed"))
            return BadRequest(new ProblemDetails { Title = "Invalid status." });
        try { return await store.SetAdminStatusAsync(id, request.Status, ct) is { } order ? Ok(order) : NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(new ProblemDetails { Title = ex.Message }); }
    }
}
