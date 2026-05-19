---
applyTo: "test/**"
---

# Testing conventions

## Test layout — not co-located

Tests live in the top-level `test/` directory and mirror the source tree exactly. They are **not** next to the files they test.

```
test/
├── backend/
│   └── MockEcommerce.Api.Tests/
│       ├── Endpoints/
│       │   └── ProductEndpointTests.cs
│       └── Services/
│           └── MockProductServiceTests.cs
└── frontend/
    ├── App.test.tsx
    ├── components/
    │   ├── Header/Header.test.tsx
    │   ├── HeroBanner/HeroBanner.test.tsx
    │   ├── ProductCard/ProductCard.test.tsx
    │   └── ProductList/ProductList.test.tsx
    └── hooks/
        └── useProducts.test.ts
```

When creating a new test file, place it at the mirrored path under `test/`, not beside the source file.

## Frontend tests (Vitest + React Testing Library)

**Run from the repo root:**
```
npm test          # equivalent to npx vitest run
npx vitest        # watch mode
```

**Config:** `vitest.config.ts` at the repo root.
- Environment: `jsdom`
- Globals enabled (`describe`, `it`, `expect`, `vi` — no imports needed)
- Setup file: `src/frontend/src/test-setup.ts` (imports `@testing-library/jest-dom`)
- Test include pattern: `test/frontend/**/*.{test,spec}.{ts,tsx}`

**Import paths** in frontend test files traverse up from `test/frontend/` to reach source:
```ts
import { ProductCard } from '../../../../src/frontend/src/components/ProductCard';
import type { Product } from '../../../../src/frontend/src/types';
```
Count directory levels carefully: `test/frontend/components/ProductCard/` is four levels up to the repo root, then down into `src/`.

**RTL conventions used in this codebase:**
- Prefer `screen.getByRole` and `screen.getByText` over `getByTestId`.
- Use `userEvent` (from `@testing-library/user-event`) for interactions, not `fireEvent`.
- Mock functions are created with `vi.fn()`.
- Async interactions: `await userEvent.click(...)`.

**Example structure:**
```ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '../../../../src/frontend/src/components/ProductCard';

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);
    expect(screen.getByText('Test Headphones')).toBeInTheDocument();
  });
});
```

## Backend tests (xUnit + WebApplicationFactory)

**Run from `test/backend/`:**
```
cd test/backend
dotnet test
```

**Project:** `test/backend/MockEcommerce.Api.Tests/MockEcommerce.Api.Tests.csproj`
- References `src/backend/MockEcommerce.Api/MockEcommerce.Api.csproj` directly.
- Packages: `xunit` 2.x, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.NET.Test.Sdk`, `coverlet.collector`.
- Global using: `Xunit` (no need to import xUnit types in each file).
- Nullable and implicit usings are enabled.

**Integration tests** use `WebApplicationFactory<Program>` via `IClassFixture<>`. This works because `Program.cs` declares `public partial class Program {}` at the end.

```csharp
public class ProductEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithProducts()
    {
        var response = await _client.GetAsync("/api/products");
        response.EnsureSuccessStatusCode();
        var products = await response.Content.ReadFromJsonAsync<List<Product>>();
        Assert.NotNull(products);
    }
}
```

**Unit tests** instantiate service classes directly — no DI container:
```csharp
public class MockProductServiceTests
{
    private readonly MockProductService _service = new();
    ...
}
```

**Naming convention:** `MethodName_Condition_ExpectedResult` (e.g. `GetById_WithInvalidId_ReturnsNull`).

## What is not yet tested

The following are stubbed and have no tests yet — tests should be added when implementations are written:
- `InMemoryCartService` methods (unit tests)
- `CartEndpoints` handlers (integration tests via `WebApplicationFactory`)
