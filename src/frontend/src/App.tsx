import { useState, useRef, useEffect } from 'react';
import type { Product } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductList } from './components/ProductList';
import { CartDrawer } from './components/CartDrawer';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import './App.css';

export function App() {
  const { products, loading, error } = useProducts();
  const cart = useCart();
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleAddToCart(product: Product) {
    try {
      await cart.addItem(product.id, 1);
      setCartMessage(`"${product.name}" added to cart!`);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCartMessage(null), 3000);
    } catch {
      setCartMessage('Failed to add item to cart.');
    }
  }

  return (
    <div className="app">
      <Header cartItemCount={cart.totalItems} onCartClick={() => setIsCartOpen(true)} />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart.items}
        totalPrice={cart.totalPrice}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onClear={cart.clearAll}
      />
      <HeroBanner />

      <main className="app__main">
        <h1 className="app__section-heading">Our products</h1>

        {cartMessage && (
          <div className="app__notification" role="status">
            {cartMessage}
          </div>
        )}

        {loading && <p className="app__loading">Loading products…</p>}
        {error && <p className="app__error">Error: {error}</p>}
        {!loading && !error && (
          <ProductList products={products} onAddToCart={handleAddToCart} getItemQuantity={cart.getItemQuantity} />
        )}
      </main>
    </div>
  );
}
