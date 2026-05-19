# Cart Feature — Specification

## Overview

Users can add products to a shopping cart, view cart contents in a slide-out drawer, update quantities, and remove items. Each product has a maximum purchase quantity of **5 units**.

---

## Backend API

All endpoints live under `/api/cart`. The cart is a singleton shared across all sessions (no authentication).

### Models

**CartItem** (existing — `Models/CartItem.cs`):

| Field | Type | Notes |
|---|---|---|
| ProductId | int | FK to Product |
| ProductName | string | Snapshot at time of add |
| UnitPrice | decimal | Snapshot at time of add |
| Quantity | int | 1–5 |
| TotalPrice | decimal | Computed: UnitPrice × Quantity (not persisted) |

**AddToCartRequest** (existing — bottom of `CartEndpoints.cs`):
`record AddToCartRequest(int ProductId, int Quantity)`

**UpdateCartItemRequest** (new):
`record UpdateCartItemRequest(int Quantity)`

### Endpoints

#### GET /api/cart

Returns all items in the cart.

- **Response**: `200 OK` with `CartItem[]`
- Empty cart returns `200` with `[]`

#### POST /api/cart

Adds a product to the cart or increments its quantity.

- **Request body**: `{ "productId": int, "quantity": int }`
- **Validation** (checked in this order):
  1. `quantity` must be > 0 → else `422 ValidationProblem`
  2. `productId` must exist in the product catalog → else `404 NotFound` with message `"Product with ID {id} not found."`
  3. If the product is already in the cart, `existingItem.Quantity + request.Quantity` must be ≤ 5 → else `422 ValidationProblem`. **The existing cart item's quantity must be preserved unchanged** — do not increment first and roll back; validate before mutating.
- **Success**:
  - New item: `201 Created` with `CartItem` and `Location: /api/cart` header
  - Existing item (quantity incremented): `200 OK` with updated `CartItem`

> **Important**: The max-quantity check must happen *before* calling `cartService.Add()`. The endpoint reads the current quantity via `cartService.GetByProductId()`, computes the would-be total, and only proceeds to add if the total is ≤ 5. If validation fails the cart is not modified at all — the original quantity is preserved.

#### PUT /api/cart/{productId}

Sets the quantity of an existing cart item to an absolute value.

- **Route param**: `productId` (int)
- **Request body**: `{ "quantity": int }`
- **Validation**:
  - `quantity` must be > 0 and ≤ 5 → else `422 ValidationProblem`
  - Item must already be in the cart → else `404 NotFound`
- **Success**: `200 OK` with updated `CartItem`

#### DELETE /api/cart/{productId}

Removes one product from the cart.

- **Route param**: `productId` (int)
- **Success**: `204 No Content`
- **Not found**: `404 Not Found`

#### DELETE /api/cart

Removes all items from the cart.

- **Response**: `204 No Content` (always succeeds, even if cart is already empty)

### InMemoryCartService

All methods use the existing `Lock _lock` for thread safety.

- `GetAll()` → return a copy/snapshot of `_cart` inside lock
- `GetByProductId(int productId)` → find by ProductId inside lock; return null if not found
- `Add(CartItem item)` → inside lock: if item with same ProductId exists, set its Quantity to the new value; otherwise append. Return the item.
- `Remove(int productId)` → inside lock: remove by ProductId; return bool
- `Clear()` → inside lock: clear the list

The max-quantity-of-5 rule is enforced at the **endpoint layer**, not in the service. The service is a dumb store.

### Edge Cases

| Scenario | Expected Result |
|---|---|
| POST with productId not in catalog | `404` with `"Product with ID {id} not found."` |
| POST with quantity ≤ 0 | `422` ValidationProblem |
| POST that would bring qty above 5 | `422` ValidationProblem with max-limit message |
| PUT with quantity 0 or negative | `422` ValidationProblem |
| PUT with quantity > 5 | `422` ValidationProblem |
| PUT for item not in cart | `404` |
| DELETE for item not in cart | `404` |
| GET on empty cart | `200` with `[]` |
| DELETE /api/cart on empty cart | `204` |

---

## Frontend

### Cart Drawer

A slide-out panel that overlays the right side of the page. Triggered by clicking the existing cart button in the Header.

**Contents:**
- Title: "Your Cart"
- List of cart items, each showing:
  - Product name
  - Unit price (formatted `$XX.XX`)
  - Quantity with +/− stepper buttons
  - Line total (unit price × quantity)
  - Remove button
- Cart total (sum of all line totals) at the bottom
- "Clear cart" button (only shown when cart has items)
- Close button (× or click outside)
- Empty state: message like "Your cart is empty" when no items

**Stepper behavior:**
- "−" button decrements quantity by 1; if quantity reaches 0, the item is removed (calls DELETE)
- "+" button increments quantity by 1; disabled when quantity is 5 (max reached)
- Each change calls `PUT /api/cart/{productId}` with the new absolute quantity

### Product Page — Max Quantity Enforcement

The "Add to cart" button on `ProductCard` is disabled when the product already has 5 units in the cart. This requires the product page to know the current cart state.

- If a product has qty 5 in the cart, the button label/aria-label changes to "Max quantity reached"
- The button is disabled
- If the backend still rejects (race condition), the existing error notification handles it

### API Layer (`api/index.ts`)

New functions:

```ts
fetchCart(): Promise<CartItem[]>                                        // GET /api/cart
updateCartItem(productId: number, quantity: number): Promise<CartItem>  // PUT /api/cart/{productId}
removeFromCart(productId: number): Promise<void>                        // DELETE /api/cart/{productId}
clearCart(): Promise<void>                                              // DELETE /api/cart
```

Export the `CartItem` interface from `types/index.ts` (move from inline in `api/index.ts`).

### useCart Hook

```ts
interface UseCartResult {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalPrice: number;
  totalItems: number;
  addItem(productId: number, quantity: number): Promise<void>;
  updateQuantity(productId: number, quantity: number): Promise<void>;
  removeItem(productId: number): Promise<void>;
  clearAll(): Promise<void>;
  getItemQuantity(productId: number): number;
}
```

- Fetches cart on mount via `fetchCart()`
- Refetches after each mutation (add/update/remove/clear)
- `getItemQuantity(productId)` returns the current qty for a product (used by ProductCard to check max)
- `totalPrice` and `totalItems` are derived from items

### State Flow Changes

- `App.tsx` owns the `useCart` hook instead of a local `cartItemCount` counter
- `cartItemCount` is derived from `useCart().totalItems`
- `handleAddToCart` calls `useCart().addItem()` instead of calling `addToCart()` directly
- `useCart` and its `getItemQuantity` are passed down to `ProductList`/`ProductCard` so cards know current cart qty

### Component Tree

```
App
├── Header            (cartItemCount from useCart.totalItems, onCartClick)
├── CartDrawer        (items, handlers from useCart; isOpen state in App)
├── HeroBanner
└── ProductList
    └── ProductCard   (receives cartQuantity via getItemQuantity to disable at max)
```

### New Files

| File | Description |
|---|---|
| `src/frontend/src/components/CartDrawer/CartDrawer.tsx` | Slide-out cart panel |
| `src/frontend/src/components/CartDrawer/index.ts` | Barrel export |
| `src/frontend/src/hooks/useCart.ts` | Cart state hook |

### Modified Files

| File | Change |
|---|---|
| `src/frontend/src/api/index.ts` | Add `fetchCart`, `updateCartItem`, `removeFromCart`, `clearCart`; remove inline `CartItem` |
| `src/frontend/src/types/index.ts` | Add `CartItem` interface |
| `src/frontend/src/App.tsx` | Replace local cart state with `useCart`; add `CartDrawer`; add `isCartOpen` state |
| `src/frontend/src/App.css` | Add cart drawer styles |
| `src/frontend/src/components/Header/Header.tsx` | Add `onCartClick` prop |
| `src/frontend/src/components/ProductCard/ProductCard.tsx` | Add `cartQuantity` prop; disable button when qty ≥ 5 |
| `src/frontend/src/components/ProductList/ProductList.tsx` | Add `getItemQuantity` prop; pass `cartQuantity` to each ProductCard |
