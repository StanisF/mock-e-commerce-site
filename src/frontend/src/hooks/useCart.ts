import { useState, useEffect, useCallback } from 'react';
import type { CartItem } from '../types';
import { fetchCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../api';

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

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      const data = await fetchCart();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(async (productId: number, quantity: number) => {
    await addToCart({ productId, quantity });
    await loadCart();
  }, [loadCart]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    await updateCartItem(productId, quantity);
    await loadCart();
  }, [loadCart]);

  const removeItem = useCallback(async (productId: number) => {
    await removeFromCart(productId);
    await loadCart();
  }, [loadCart]);

  const clearAll = useCallback(async () => {
    await clearCart();
    await loadCart();
  }, [loadCart]);

  const getItemQuantity = useCallback((productId: number): number => {
    return items.find(item => item.productId === productId)?.quantity ?? 0;
  }, [items]);

  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, loading, error, totalPrice, totalItems, addItem, updateQuantity, removeItem, clearAll, getItemQuantity };
}
