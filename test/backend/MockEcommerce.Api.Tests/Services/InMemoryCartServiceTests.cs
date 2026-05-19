using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Tests.Services;

public class InMemoryCartServiceTests
{
    private static CartItem MakeItem(int productId, int quantity = 1) => new()
    {
        ProductId = productId,
        ProductName = $"Product {productId}",
        UnitPrice = 9.99m,
        Quantity = quantity
    };

    [Fact]
    public void GetAll_EmptyCart_ReturnsEmptyCollection()
    {
        var service = new InMemoryCartService();

        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Add_NewItem_ReturnsItemWithCorrectFields()
    {
        var service = new InMemoryCartService();

        var result = service.Add(MakeItem(1, 2));

        Assert.Equal(1, result.ProductId);
        Assert.Equal("Product 1", result.ProductName);
        Assert.Equal(9.99m, result.UnitPrice);
        Assert.Equal(2, result.Quantity);
    }

    [Fact]
    public void Add_ExistingProduct_SetsQuantityToNewValue()
    {
        var service = new InMemoryCartService();
        service.Add(MakeItem(1, 2));

        var result = service.Add(MakeItem(1, 4));

        Assert.Equal(4, result.Quantity);
        Assert.Single(service.GetAll());
    }

    [Fact]
    public void GetByProductId_ExistingProduct_ReturnsItem()
    {
        var service = new InMemoryCartService();
        service.Add(MakeItem(1));

        var result = service.GetByProductId(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.ProductId);
    }

    [Fact]
    public void GetByProductId_MissingProduct_ReturnsNull()
    {
        var service = new InMemoryCartService();

        Assert.Null(service.GetByProductId(9999));
    }

    [Fact]
    public void Remove_ExistingItem_ReturnsTrueAndRemovesItem()
    {
        var service = new InMemoryCartService();
        service.Add(MakeItem(1));

        var result = service.Remove(1);

        Assert.True(result);
        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Remove_MissingItem_ReturnsFalse()
    {
        var service = new InMemoryCartService();

        Assert.False(service.Remove(9999));
    }

    [Fact]
    public void Clear_EmptiesCart()
    {
        var service = new InMemoryCartService();
        service.Add(MakeItem(1));
        service.Add(MakeItem(2));

        service.Clear();

        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void GetAll_ReturnsSnapshot_ModifyingResultDoesNotAffectCart()
    {
        var service = new InMemoryCartService();
        service.Add(MakeItem(1));

        var snapshot = service.GetAll().ToList();
        snapshot.Clear();

        Assert.Single(service.GetAll());
    }
}
