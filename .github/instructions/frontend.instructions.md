---
applyTo: "src/frontend/**,test/frontend/**"
---

# Frontend conventions

## Project location

The frontend is a Vite + React 19 + TypeScript app at `src/frontend/`. The root `package.json` declares it as an npm workspace; install dependencies from the repo root or from `src/frontend/`.

## Source layout

```
src/frontend/src/
├── main.tsx              # React entry point
├── App.tsx               # Root component — owns cart state and notification toast
├── App.css
├── index.css
├── test-setup.ts         # Imports @testing-library/jest-dom (used by Vitest)
├── api/
│   └── index.ts          # All fetch() calls to /api — fetchProducts, fetchProductById, addToCart
├── components/
│   ├── Header/           # Site header with cart badge
│   ├── HeroBanner/       # Promotional banner
│   ├── ProductCard/      # Single product card
│   └── ProductList/      # Grid of ProductCard components
├── hooks/
│   └── useProducts.ts    # Fetches catalog on mount; returns { products, loading, error }
└── types/
    └── index.ts          # Shared TypeScript interfaces
```

## Component folder convention

Each component lives in its own folder under `components/` and must export from an `index.ts` barrel file:

```
components/ProductCard/
├── ProductCard.tsx   # named export: export function ProductCard(...)
└── index.ts          # re-export: export { ProductCard } from './ProductCard';
```

Always use named exports, never default exports, for components.

## Types

Shared interfaces live in `src/frontend/src/types/index.ts`:

- `Product` — `{ id, name, description, price, category, stock, imageUrl }`
- `AddToCartRequest` — `{ productId, quantity }`

The frontend also has a local `CartItem` interface defined inline in `api/index.ts` (not exported); it mirrors the backend model.

## API layer

`src/frontend/src/api/index.ts` is the only place that calls `fetch`. All paths use the `/api` prefix, which Vite proxies to `http://localhost:5063` during development:

```ts
const BASE_URL = '/api';
export async function fetchProducts(): Promise<Product[]> { ... }
export async function fetchProductById(id: number): Promise<Product> { ... }
export async function addToCart(request: AddToCartRequest): Promise<CartItem> { ... }
```

Do not scatter `fetch` calls into components or hooks — always add new API calls here.

## Hooks

`useProducts` is the only custom hook. It calls `fetchProducts()` in a `useEffect` and returns `{ products, loading, error }`. The pattern for new hooks is: start with loading state, settle into data or error, never throw.

## Cart state

Cart item count and the notification toast are managed at the `App` level. `handleAddToCart` in `App.tsx`:
1. Calls `addToCart({ productId, quantity: 1 })`.
2. Increments `cartItemCount` on success.
3. Shows a timed notification (`cartMessage`) that clears after 3 s via `setTimeout`.
4. The timer ref (`timerRef`) is cleaned up in a `useEffect` return to avoid memory leaks.

`cartItemCount` is passed down as a prop to `Header`. There is no shared state library (no Redux, no Context for cart).

## ProductCard behaviour

- Renders product image with `loading="lazy"` and explicit `width`/`height` (300×300).
- The "Add to cart" button uses `aria-label`: `"Add {name} to cart"` when in stock, `"Out of Stock"` when `stock === 0`.
- The button is `disabled` when `stock === 0`.
- Price is formatted with `.toFixed(2)`.

## Vite dev proxy

Configured in `src/frontend/vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:5063',
  },
},
```

All `/api/*` requests from the browser are forwarded to the .NET backend. No CORS configuration is needed in the browser during development.

## TypeScript config

`src/frontend/tsconfig.app.json` governs the app source. Strict mode is on. Do not use `any`; prefer `unknown` with type narrowing.
