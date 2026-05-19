# Cart Feature — Implementation Plan

## Phase 1: Backend Service Layer

_No dependencies. Start here._

### Step 1 — Implement InMemoryCartService

File: `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

Implement all five methods using the existing `_cart` list and `_lock`:

1. `GetAll()` — lock, return `_cart.ToList()` (snapshot)
2. `GetByProductId(int productId)` — lock, return `_cart.FirstOrDefault(c => c.ProductId == productId)`
3. `Add(CartItem item)` — lock, check for existing item by ProductId. If found, update its Quantity to `item.Quantity`. If not, add to list. Return the item.
4. `Remove(int productId)` — lock, find item by ProductId, remove it if found, return bool
5. `Clear()` — lock, `_cart.Clear()`

### Step 2 — Unit tests for InMemoryCartService

File: `test/backend/MockEcommerce.Api.Tests/Services/InMemoryCartServiceTests.cs`

Test cases:
- GetAll on empty cart returns empty collection
- Add new item returns item with correct fields
- Add same product twice increments quantity
- GetByProductId returns correct item
- GetByProductId returns null for missing item
- Remove existing item returns true
- Remove missing item returns false
- Clear empties the cart
- GetAll returns snapshot (modifying returned list doesn't affect cart)

Verify: `cd test/backend && dotnet test`

## Phase 2: Backend Endpoints

_Depends on Phase 1._

### Step 3 — Add UpdateCartItemRequest model

File: `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs` (bottom, beside `AddToCartRequest`)

Add: `public record UpdateCartItemRequest(int Quantity);`

### Step 4 — Implement all CartEndpoints handlers

File: `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

1. **GetCart** — call `cartService.GetAll()`, return `TypedResults.Ok(...)`
2. **AddToCart** — validate quantity > 0; look up product (404 if missing); check max-qty rule (existing + requested ≤ 5, else ValidationProblem); create or update CartItem via service; return Created or Ok
3. **UpdateCartItem** (new handler) — validate quantity > 0 and ≤ 5; find item in cart (404 if missing); update quantity; return Ok
4. **RemoveFromCart** — call `cartService.Remove(productId)`; return NoContent or NotFound
5. **ClearCart** — call `cartService.Clear()`; return NoContent

### Step 5 — Register the PUT route

File: `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs` (in `MapCartEndpoints`)

Add `group.MapPut("/{productId:int}", UpdateCartItem)` with name and summary.

### Step 6 — Integration tests for CartEndpoints

File: `test/backend/MockEcommerce.Api.Tests/Endpoints/CartEndpointTests.cs`

Use `WebApplicationFactory<Program>` + `IClassFixture<>` pattern. The singleton cart is shared across tests in a class, so clear the cart between tests.

Test cases:
- GET /api/cart on empty cart → 200 with []
- POST /api/cart with valid product → 201 with CartItem
- POST /api/cart same product again → 200 with incremented qty
- POST /api/cart with invalid product ID → 404
- POST /api/cart with quantity 0 → 422
- POST /api/cart exceeding max qty 5 → 422
- PUT /api/cart/{id} with valid qty → 200
- PUT /api/cart/{id} with qty > 5 → 422
- PUT /api/cart/{id} for item not in cart → 404
- DELETE /api/cart/{id} for existing item → 204
- DELETE /api/cart/{id} for missing item → 404
- DELETE /api/cart (clear) → 204

Verify: `cd test/backend && dotnet test`

## Phase 3: Frontend API and Types

_Can start in parallel with Phase 2 tests (Step 6)._

### Step 7 — Add CartItem type

File: `src/frontend/src/types/index.ts`

Add `CartItem` interface (`productId`, `productName`, `unitPrice`, `quantity`, `totalPrice`). Remove the inline `CartItem` interface from `api/index.ts`.

### Step 8 — Add new API functions

File: `src/frontend/src/api/index.ts`

Add: `fetchCart()`, `updateCartItem(productId, quantity)`, `removeFromCart(productId)`, `clearCart()`. Update `addToCart` return type to use the exported `CartItem`.

## Phase 4: Frontend Cart Hook

_Depends on Phase 3._

### Step 9 — Create useCart hook

File: `src/frontend/src/hooks/useCart.ts`

Implement `useCart()` returning `{ items, loading, error, totalPrice, totalItems, addItem, updateQuantity, removeItem, clearAll, getItemQuantity }`.

- Fetch cart on mount
- Each mutation calls the API, then refetches the full cart
- `getItemQuantity(productId)` returns qty for a given product (0 if not in cart)

## Phase 5: Frontend Components

_Depends on Phase 4._

### Step 10 — Create CartDrawer component

Files:
- `src/frontend/src/components/CartDrawer/CartDrawer.tsx`
- `src/frontend/src/components/CartDrawer/index.ts`

Props: `isOpen`, `onClose`, `items`, `totalPrice`, `onUpdateQuantity`, `onRemove`, `onClear`

Renders: overlay backdrop, slide-out panel with cart items, stepper controls (+/− buttons), totals, clear button, close button. Empty state when no items. "−" at qty 1 removes the item. "+" disabled at qty 5.

### Step 11 — Add CartDrawer styles

File: `src/frontend/src/App.css`

Add styles for `.cart-drawer`, `.cart-drawer__overlay`, `.cart-drawer__panel`, cart item rows, stepper buttons, etc. Use existing CSS custom properties (`--bg`, `--border`, `--radius`, `--blue`, etc.).

### Step 12 — Update Header

File: `src/frontend/src/components/Header/Header.tsx`

Add `onCartClick` prop. Attach it as `onClick` handler to the existing cart button.

### Step 13 — Update ProductCard and ProductList

File: `src/frontend/src/components/ProductCard/ProductCard.tsx`
- Add optional `cartQuantity` prop (default 0)
- When `cartQuantity >= 5`, disable button and change aria-label to "Max quantity reached"

File: `src/frontend/src/components/ProductList/ProductList.tsx`
- Add `getItemQuantity` prop
- Pass `cartQuantity={getItemQuantity(product.id)}` to each ProductCard

### Step 14 — Integrate everything in App.tsx

File: `src/frontend/src/App.tsx`

- Replace `cartItemCount` state and `handleAddToCart` with `useCart()` hook
- Add `isCartOpen` state
- Pass `onCartClick` to Header
- Render `<CartDrawer>` with props from useCart
- Pass `getItemQuantity` to ProductList
- Update `handleAddToCart` to call `useCart().addItem()` then show notification

## Phase 6: Frontend Tests

_Depends on Phase 5._

### Step 15 — Test useCart hook

File: `test/frontend/hooks/useCart.test.ts`

Mock `api/index.ts`. Test: initial fetch, addItem, updateQuantity, removeItem, clearAll, getItemQuantity, error handling.

### Step 16 — Test CartDrawer component

File: `test/frontend/components/CartDrawer/CartDrawer.test.tsx`

Test: renders items with names/prices/quantities, stepper buttons call handlers, remove button, clear button, close button, empty state.

### Step 17 — Update existing tests

- `test/frontend/App.test.tsx` — mock `useCart` (or the API functions it uses); test cart drawer open/close, add-to-cart flow with max qty, notification behavior
- `test/frontend/components/Header/Header.test.tsx` — test `onCartClick` prop fires on button click
- `test/frontend/components/ProductCard/ProductCard.test.tsx` — test disabled state when `cartQuantity >= 5`
- `test/frontend/components/ProductList/ProductList.test.tsx` — test `getItemQuantity` prop forwarding

### Step 18 — Run all tests

```
cd test/backend && dotnet test
npm test
```

## Verification Checklist

- [ ] `cd test/backend && dotnet test` — all pass
- [ ] `npm test` — all pass
- [ ] Manual: start backend (`cd src/backend && dotnet run --project MockEcommerce.Api`), start frontend (`cd src/frontend && npm run dev`)
- [ ] Add item to cart → notification appears, badge updates
- [ ] Click cart icon → drawer opens showing item
- [ ] Use +/− to change quantity → total updates
- [ ] Try to exceed qty 5 → "+" button disabled at 5; "Add to cart" on product card disabled
- [ ] Remove item → item disappears
- [ ] Clear cart → all items removed, empty state shown
- [ ] Close drawer → drawer closes
