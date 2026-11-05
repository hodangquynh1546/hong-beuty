using HongBeauty.Domain.Products;

namespace HongBeauty.UnitTests;

public sealed class ProductTests
{
    [Fact]
    public void Reserve_DecrementsStock_AndRejectsOversell()
    {
        var product = new Product("Serum", "serum", "", 250000, 2);
        product.Reserve(1);
        Assert.Equal(1, product.Stock);
        Assert.Throws<InvalidOperationException>(() => product.Reserve(2));
        Assert.Equal(1, product.Stock);
    }

    [Fact]
    public void Restore_ReturnsStockAfterCancellation()
    {
        var product = new Product("Serum", "serum", "", 250000, 2);
        product.Reserve(2);
        product.Restore(2);
        Assert.Equal(2, product.Stock);
    }
}
