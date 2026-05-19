import { renderHook, act } from '@testing-library/react';
import { useCart } from '../../../src/frontend/src/hooks/useCart';

vi.mock('../../../src/frontend/src/api');

import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../../../src/frontend/src/api';

import type { CartItem } from '../../../src/frontend/src/types';

const mockedFetchCart = vi.mocked(fetchCart);
const mockedAddToCart = vi.mocked(addToCart);
const mockedUpdateCartItem = vi.mocked(updateCartItem);
const mockedRemoveFromCart = vi.mocked(removeFromCart);
const mockedClearCart = vi.mocked(clearCart);

const mockItems: CartItem[] = [
  { productId: 1, productName: 'Wireless Headphones', unitPrice: 79.99, quantity: 2, totalPrice: 159.98 },
  { productId: 2, productName: 'Running Shoes', unitPrice: 59.99, quantity: 1, totalPrice: 59.99 },
];

describe('useCart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches cart on mount and returns items', async () => {
    mockedFetchCart.mockResolvedValue(mockItems);

    const { result } = renderHook(() => useCart());

    expect(result.current.loading).toBe(true);
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual(mockItems);
    expect(result.current.error).toBeNull();
  });

  it('computes totalPrice from items', async () => {
    mockedFetchCart.mockResolvedValue(mockItems);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    expect(result.current.totalPrice).toBeCloseTo(219.97);
  });

  it('computes totalItems from item quantities', async () => {
    mockedFetchCart.mockResolvedValue(mockItems);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    expect(result.current.totalItems).toBe(3);
  });

  it('getItemQuantity returns quantity for item in cart', async () => {
    mockedFetchCart.mockResolvedValue(mockItems);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    expect(result.current.getItemQuantity(1)).toBe(2);
  });

  it('getItemQuantity returns 0 for item not in cart', async () => {
    mockedFetchCart.mockResolvedValue(mockItems);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    expect(result.current.getItemQuantity(9999)).toBe(0);
  });

  it('addItem calls addToCart then refetches cart', async () => {
    const updatedItems = [...mockItems, { productId: 3, productName: 'Water Bottle', unitPrice: 24.99, quantity: 1, totalPrice: 24.99 }];
    mockedFetchCart.mockResolvedValueOnce(mockItems).mockResolvedValueOnce(updatedItems);
    mockedAddToCart.mockResolvedValue(updatedItems[2]);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    await act(async () => {
      await result.current.addItem(3, 1);
    });

    expect(mockedAddToCart).toHaveBeenCalledWith({ productId: 3, quantity: 1 });
    expect(result.current.items).toEqual(updatedItems);
  });

  it('updateQuantity calls updateCartItem then refetches cart', async () => {
    const updatedItems: CartItem[] = [{ ...mockItems[0], quantity: 3, totalPrice: 239.97 }, mockItems[1]];
    mockedFetchCart.mockResolvedValueOnce(mockItems).mockResolvedValueOnce(updatedItems);
    mockedUpdateCartItem.mockResolvedValue(updatedItems[0]);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    await act(async () => {
      await result.current.updateQuantity(1, 3);
    });

    expect(mockedUpdateCartItem).toHaveBeenCalledWith(1, 3);
    expect(result.current.items).toEqual(updatedItems);
  });

  it('removeItem calls removeFromCart then refetches cart', async () => {
    const updatedItems = [mockItems[1]];
    mockedFetchCart.mockResolvedValueOnce(mockItems).mockResolvedValueOnce(updatedItems);
    mockedRemoveFromCart.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    await act(async () => {
      await result.current.removeItem(1);
    });

    expect(mockedRemoveFromCart).toHaveBeenCalledWith(1);
    expect(result.current.items).toEqual(updatedItems);
  });

  it('clearAll calls clearCart then refetches cart', async () => {
    mockedFetchCart.mockResolvedValueOnce(mockItems).mockResolvedValueOnce([]);
    mockedClearCart.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    await act(async () => {
      await result.current.clearAll();
    });

    expect(mockedClearCart).toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });

  it('sets error when fetchCart fails', async () => {
    mockedFetchCart.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCart());
    await act(async () => {});

    expect(result.current.error).toBe('Network error');
    expect(result.current.items).toEqual([]);
  });
});
