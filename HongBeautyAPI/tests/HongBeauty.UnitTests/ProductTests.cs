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

    [Fact]
    public void Update_RejectsSalePriceAboveRegularPrice()
    {
        var product = new Product("Serum", "serum", "", 250000, 2);
        Assert.Throws<ArgumentOutOfRangeException>(() => product.Update(null, "Serum", "serum", "", 250000, 260000, 2, true, null));
        Assert.Equal(250000, product.Price);
    }

    [Fact]
    public void Category_Deactivation_KeepsItsIdentity()
    {
        var category = new Category("Chăm sóc da", "cham-soc-da", "");
        var id = category.Id;
        category.Deactivate();
        Assert.False(category.IsActive);
        Assert.Equal(id, category.Id);
    }
}
