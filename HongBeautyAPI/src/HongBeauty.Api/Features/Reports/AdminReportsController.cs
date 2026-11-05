using HongBeauty.Api.Authorization;
using HongBeauty.Domain.Reports;
using HongBeauty.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HongBeauty.Api.Features.Reports;

public sealed record ExpenseInput(string Category, string Note, decimal Amount, DateTimeOffset OccurredAt);
public sealed record ProductSalesDto(Guid ProductId, string Name, int Units, decimal Revenue);
public sealed record StockRowDto(Guid ProductId, string Name, int Stock, decimal CostPrice);
public sealed record ReportDto(DateTimeOffset From, DateTimeOffset To, decimal Revenue, decimal GoodsCost,
    decimal Expenses, decimal EstimatedProfit, int PaidOrders, int UnitsSold, int CompletedAppointments,
    int ProductsWithoutCost, IReadOnlyList<ProductSalesDto> ProductSales, IReadOnlyList<StockRowDto> LowStock,
    IReadOnlyList<ShopExpense> ExpenseRows);

[ApiController]
[Route("api/v1/admin/reports")]
[RequirePermission("orders.manage")]
public sealed class AdminReportsController(HongBeautyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string period = "month", CancellationToken ct = default)
    {
        if (period is not ("week" or "month")) return BadRequest(new ProblemDetails { Title = "Chọn tuần hoặc tháng." });
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var start = period == "week" ? today.AddDays(-((int)today.DayOfWeek + 6) % 7) : new DateOnly(today.Year, today.Month, 1);
        var end = period == "week" ? start.AddDays(7) : start.AddMonths(1);
        var from = new DateTimeOffset(start.ToDateTime(TimeOnly.MinValue), TimeSpan.FromHours(7)).ToUniversalTime();
        var to = new DateTimeOffset(end.ToDateTime(TimeOnly.MinValue), TimeSpan.FromHours(7)).ToUniversalTime();
        var orders = await db.Orders.AsNoTracking().Include(x => x.Items)
            .Where(x => x.PaidAt >= from && x.PaidAt < to && x.PaymentStatus == "Paid")
            .ToListAsync(ct);
        var expenseRows = await db.ShopExpenses.AsNoTracking().Where(x => x.OccurredAt >= from && x.OccurredAt < to)
            .OrderByDescending(x => x.OccurredAt).ToListAsync(ct);
        var stock = await db.Products.AsNoTracking().Select(x => new StockRowDto(x.Id, x.Name, x.Stock, x.CostPrice)).ToListAsync(ct);
        var appointmentCount = await db.BeautyAppointments.AsNoTracking()
            .CountAsync(x => x.Status == "Completed" && x.StartsAt >= from && x.StartsAt < to, ct);
        var sales = orders.SelectMany(x => x.Items).GroupBy(x => new { x.ProductId, x.ProductName })
            .Select(g => new ProductSalesDto(g.Key.ProductId, g.Key.ProductName, g.Sum(x => x.Quantity),
                g.Sum(x => x.UnitPrice * x.Quantity))).OrderByDescending(x => x.Units).ToList();
        var revenue = orders.Sum(x => x.Total);
        var goodsCost = orders.SelectMany(x => x.Items).Sum(x => x.UnitCost * x.Quantity);
        var expenses = expenseRows.Sum(x => x.Amount);
        return Ok(new ReportDto(from, to, revenue, goodsCost, expenses, revenue - goodsCost - expenses,
            orders.Count, sales.Sum(x => x.Units), appointmentCount, stock.Count(x => x.CostPrice == 0), sales,
            stock.Where(x => x.Stock <= 5).OrderBy(x => x.Stock).ToList(), expenseRows));
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> AddExpense(ExpenseInput input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Category) || input.Category.Length > 100 ||
            input.Note is null || input.Note.Length > 500 || input.Amount <= 0 ||
            input.OccurredAt < DateTimeOffset.UtcNow.AddYears(-5) || input.OccurredAt > DateTimeOffset.UtcNow.AddDays(1))
            return BadRequest(new ProblemDetails { Title = "Thông tin khoản chi chưa hợp lệ." });
        var expense = new ShopExpense(input.Category, input.Note, input.Amount, input.OccurredAt);
        db.ShopExpenses.Add(expense);
        await db.SaveChangesAsync(ct);
        return Created($"/api/v1/admin/reports/expenses/{expense.Id}", expense);
    }
}
