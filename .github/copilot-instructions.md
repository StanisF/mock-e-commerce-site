# Copilot Instructions

## Project overview

This is a full-stack mock e-commerce site used as a learning/demo codebase. It has a React + TypeScript frontend and an ASP.NET Core Minimal API backend. The two are developed independently but run together locally via a Vite dev proxy.

## Repository layout

```
mock-e-commerce-site/
├── package.json              # Root npm workspace (includes src/frontend)
├── vitest.config.ts          # Vitest config — runs tests in test/frontend/
├── src/
│   ├── backend/              # .NET solution
│   │   └── MockEcommerce.Api/
│   └── frontend/             # Vite/React app
│       └── src/
└── test/
    ├── backend/              # xUnit tests (mirrors src/backend structure)
    └── frontend/             # Vitest/RTL tests (mirrors src/frontend/src structure)
```

Tests are **not co-located** with source files. They live in the top-level `test/` directory and mirror the source tree. Import paths in frontend tests therefore traverse upward: `../../../../src/frontend/src/...`.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Frontend tests | Vitest 4, React Testing Library, jsdom |
| Backend | ASP.NET Core Minimal API, .NET 10 |
| Backend tests | xUnit 2, `Microsoft.AspNetCore.Mvc.Testing` (WebApplicationFactory) |

## Running the project

**Frontend dev server** (port 5173):
```
cd src/frontend
npm run dev
```

**Backend** (port 5063):
```
cd src/backend
dotnet run --project MockEcommerce.Api
```

The Vite dev server proxies `/api/*` → `http://localhost:5063`, so the frontend calls `/api/products` and Vite forwards it to the .NET server. No CORS issues during local development. The backend also configures CORS to allow `http://localhost:5173` for non-proxied scenarios.

**Frontend tests** (from repo root):
```
npm test
# or
npx vitest run
```

**Backend tests**:
```
cd test/backend
dotnet test
```

## Product catalog

`MockProductService` returns a fixed list of five products (IDs 1–5). These are the only products that exist — do not invent others when writing tests or validation logic.

| ID | Name | Price | Category | Stock |
|---|---|---|---|---|
| 1 | Wireless Headphones | $79.99 | Electronics | 25 |
| 2 | Running Shoes | $59.99 | Footwear | 40 |
| 3 | Stainless Steel Water Bottle | $24.99 | Accessories | 100 |
| 4 | Mechanical Keyboard | $109.99 | Electronics | 15 |
| 5 | Yoga Mat | $34.99 | Sports | 60 |

All images use `https://placehold.co/300x300?text=<name>` URLs.

## What is implemented vs. stubbed

### Implemented
- `GET /api/products` — returns the full hard-coded product catalog
- `GET /api/products/{id}` — returns a single product or 404
- Frontend product listing: `useProducts` hook → `fetchProducts()` → `ProductList` → `ProductCard`
- Frontend "Add to cart" button — calls `POST /api/cart` and updates the cart badge count in `App`

### Stubbed (throws `NotImplementedException`)
- All `ICartService` / `InMemoryCartService` methods: `GetAll`, `Add`, `GetByProductId`, `Remove`, `Clear`
- All `CartEndpoints` handlers: `GetCart`, `AddToCart`, `RemoveFromCart`, `ClearCart`

This means clicking "Add to cart" on the frontend currently fails at the network layer. Completing the cart feature requires implementing `InMemoryCartService` first, then wiring up the endpoint handlers in `CartEndpoints`.

## Key design decisions

- **Singleton cart**: `InMemoryCartService` is registered as a singleton — all sessions share one cart. This is intentional for the demo; a per-user scoped implementation would be needed with real auth.
- **`Program` is `partial`**: The `public partial class Program {}` declaration at the bottom of `Program.cs` exists solely to expose the entry point to `WebApplicationFactory<Program>` in integration tests.
- **No authentication** — explicitly noted as a future concern in comments.
- **OpenAPI** is registered via `app.MapOpenApi()` and accessible at `/openapi/v1.json` when running the backend.
