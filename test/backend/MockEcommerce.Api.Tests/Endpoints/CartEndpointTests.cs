using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using MockEcommerce.Api.Endpoints;
using MockEcommerce.Api.Models;

namespace MockEcommerce.Api.Tests.Endpoints;

public class CartEndpointTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly HttpClient _client;

    public CartEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        // Clear the singleton cart before each test to ensure isolation
        await _client.DeleteAsync("/api/cart");
    }

    public Task DisposeAsync() => Task.CompletedTask;

    // ── GET /api/cart ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetCart_EmptyCart_ReturnsOkWithEmptyArray()
    {
        var response = await _client.GetAsync("/api/cart");

        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    // ── POST /api/cart ────────────────────────────────────────────────────────

    [Fact]
    public async Task AddToCart_NewItem_ReturnsCreatedWithCartItem()
    {
        var response = await _client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 1 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(1, item.ProductId);
        Assert.Equal("Wireless Headphones", item.ProductName);
        Assert.Equal(79.99m, item.UnitPrice);
        Assert.Equal(1, item.Quantity);
    }

    [Fact]
    public async Task AddToCart_ExistingItem_ReturnsOkWithIncrementedQuantity()
    {
        await _client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 2 });

        var response = await _client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 1 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public async Task AddToCart_InvalidProductId_ReturnsNotFound()
    {
        var response = await _client.PostAsJsonAsync("/api/cart", new { productId = 9999, quantity = 1 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_QuantityZero_ReturnsValidationProblem()
    {
        var response = await _client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 0 });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_ExceedsMaxQuantity_ReturnsValidationProblemAndPreservesOriginalQuantity()
    {
        // Add 4 units first
        await _client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 4 });

        // Try to add 2 more — would exceed max of 5
        var response = await _client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 2 });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);

        // Verify the original quantity is unchanged
        var getResponse = await _client.GetAsync("/api/cart");
        var items = await getResponse.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        var item = Assert.Single(items);
        Assert.Equal(4, item.Quantity);
    }

    // ── PUT /api/cart/{productId} ──────────────────────────────────────────────

    [Fact]
    public async Task UpdateCartItem_ValidQuantity_ReturnsOkWithUpdatedItem()
    {
        await _client.PostAsJsonAsync("/api/cart", new { productId = 2, quantity = 1 });

        var response = await _client.PutAsJsonAsync("/api/cart/2", new { quantity = 3 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public async Task UpdateCartItem_QuantityExceedsMax_ReturnsValidationProblem()
    {
        await _client.PostAsJsonAsync("/api/cart", new { productId = 2, quantity = 1 });

        var response = await _client.PutAsJsonAsync("/api/cart/2", new { quantity = 6 });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartItem_ItemNotInCart_ReturnsNotFound()
    {
        var response = await _client.PutAsJsonAsync("/api/cart/9999", new { quantity = 1 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── DELETE /api/cart/{productId} ──────────────────────────────────────────

    [Fact]
    public async Task RemoveFromCart_ExistingItem_ReturnsNoContent()
    {
        await _client.PostAsJsonAsync("/api/cart", new { productId = 3, quantity = 1 });

        var response = await _client.DeleteAsync("/api/cart/3");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task RemoveFromCart_MissingItem_ReturnsNotFound()
    {
        var response = await _client.DeleteAsync("/api/cart/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── DELETE /api/cart ──────────────────────────────────────────────────────

    [Fact]
    public async Task ClearCart_WithItems_ReturnsNoContent()
    {
        await _client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 1 });
        await _client.PostAsJsonAsync("/api/cart", new { productId = 2, quantity = 2 });

        var response = await _client.DeleteAsync("/api/cart");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await _client.GetAsync("/api/cart");
        var items = await getResponse.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task ClearCart_EmptyCart_ReturnsNoContent()
    {
        var response = await _client.DeleteAsync("/api/cart");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }
}
