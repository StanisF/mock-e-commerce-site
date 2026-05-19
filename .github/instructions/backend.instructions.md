---
applyTo: "src/backend/**,test/backend/**"
---

# Backend conventions

## Project location and solution structure

The backend is an ASP.NET Core Minimal API targeting .NET 10, located at `src/backend/`.

```
src/backend/
└── MockEcommerce.Api/
    ├── Program.cs
    ├── Endpoints/
    │   ├── ProductEndpoints.cs   # GET /api/products, GET /api/products/{id}
    │   └── CartEndpoints.cs      # GET/POST/DELETE /api/cart — all handlers stubbed
    ├── Models/
    │   ├── Product.cs
    │   └── CartItem.cs
    └── Services/
        ├── IProductService.cs
        ├── MockProductService.cs  # fully implemented; hard-coded catalog of 5 products
        ├── ICartService.cs
        └── InMemoryCartService.cs # skeleton — all methods throw NotImplementedException
```

## Hard-coded product catalog

`MockProductService` returns a fixed static list — these are the **only** products that exist. Use real IDs and prices when writing tests or seeding data; do not invent fictional products.

| ID | Name | Price | Category | Stock |
|---|---|---|---|---|
| 1 | Wireless Headphones | $79.99 | Electronics | 25 |
| 2 | Running Shoes | $59.99 | Footwear | 40 |
| 3 | Stainless Steel Water Bottle | $24.99 | Accessories | 100 |
| 4 | Mechanical Keyboard | $109.99 | Electronics | 15 |
| 5 | Yoga Mat | $34.99 | Sports | 60 |

Product ID 9999 is a safe sentinel for "not found" tests (used in existing tests).

## Endpoint pattern

Endpoints are grouped into static classes with an extension method on `WebApplication`. Each group uses `app.MapGroup(...)` to share a route prefix and OpenAPI tag.

```csharp
public static class ProductEndpoints
{
    public static void MapProductEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/products").WithTags("Products");
        group.MapGet("/", GetAll).WithName("GetAllProducts")...;
    }

    internal static Ok<IEnumerable<Product>> GetAll(IProductService productService) { ... }
}
```

- Handler methods are `internal static`, not lambdas, so they are individually testable.
- Return types use `TypedResults` (`Ok<T>`, `Results<Ok<T>, NotFound>`, etc.) for compile-time type safety.
- New endpoint groups follow this same pattern and must be registered in `Program.cs` via their `MapXxx()` extension method.

## Service pattern

Services are registered as singletons in `Program.cs`:

```csharp
builder.Services.AddSingleton<IProductService, MockProductService>();
builder.Services.AddSingleton<ICartService, InMemoryCartService>();
```

`InMemoryCartService` is intentionally singleton (all sessions share one cart — demo choice). It has a private `List<CartItem> _cart` and a `Lock _lock` field for thread safety. All five methods (`GetAll`, `GetByProductId`, `Add`, `Remove`, `Clear`) currently throw `NotImplementedException` and need to be implemented.

## Models

`Product` and `CartItem` are plain C# classes with public `{ get; set; }` properties and XML doc comments. `CartItem.TotalPrice` is a computed property (`UnitPrice * Quantity`) — do not persist it.

`CartItem` fields: `ProductId`, `ProductName` (snapshot), `UnitPrice` (snapshot), `Quantity`, `TotalPrice` (computed).

## Adding to cart — expected behavior

`CartEndpoints.AddToCart` receives an `AddToCartRequest` (just `ProductId` and `Quantity`). It should:
1. Look up the product via `IProductService.GetById` — return `NotFound<string>` if missing.
2. Validate `Quantity > 0` — return `ValidationProblem` if invalid.
3. Check `ICartService.GetByProductId` — if an existing item is found, increment its quantity; otherwise create a new `CartItem` snapshotting `ProductName` and `UnitPrice` from the product.
4. Return `Created<CartItem>` for a new item, `Ok<CartItem>` for an updated one.

## `Program` is `partial`

The `public partial class Program {}` at the bottom of `Program.cs` is required so `WebApplicationFactory<Program>` can reference the entry point from the test project. Do not remove it.

## CORS

The backend allows `http://localhost:5173` (the Vite dev server) via the default CORS policy. During local development the Vite proxy forwards `/api/*`, so CORS is a fallback for direct calls only.

## OpenAPI

Registered via `builder.Services.AddOpenApi()` and `app.MapOpenApi()`. The spec is served at `/openapi/v1.json` at runtime.
