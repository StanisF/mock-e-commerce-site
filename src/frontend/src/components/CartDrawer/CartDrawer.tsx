import type { CartItem } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalPrice: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
}

export function CartDrawer({ isOpen, onClose, items, totalPrice, onUpdateQuantity, onRemove, onClear }: CartDrawerProps) {
  return (
    <>
      {isOpen && (
        <div
          className="cart-drawer__overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`cart-drawer__panel${isOpen ? ' cart-drawer__panel--open' : ''}`}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Your Cart</h2>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close cart">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="cart-drawer__empty">Your cart is empty.</p>
        ) : (
          <>
            <ul className="cart-drawer__list">
              {items.map((item) => (
                <li key={item.productId} className="cart-item">
                  <div className="cart-item__info">
                    <span className="cart-item__name">{item.productName}</span>
                    <span className="cart-item__price">${item.unitPrice.toFixed(2)} each</span>
                  </div>
                  <span className="cart-item__total">${item.totalPrice.toFixed(2)}</span>
                  <div className="cart-item__controls">
                    <button
                      className="cart-item__stepper"
                      onClick={() =>
                        item.quantity === 1
                          ? onRemove(item.productId)
                          : onUpdateQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label={`Decrease quantity of ${item.productName}`}
                    >
                      −
                    </button>
                    <span className="cart-item__qty" aria-label={`Quantity: ${item.quantity}`}>
                      {item.quantity}
                    </span>
                    <button
                      className="cart-item__stepper"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= 5}
                      aria-label={`Increase quantity of ${item.productName}`}
                    >
                      +
                    </button>
                    <button
                      className="cart-item__remove"
                      onClick={() => onRemove(item.productId)}
                      aria-label={`Remove ${item.productName} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__total">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button className="cart-drawer__clear" onClick={onClear}>
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
