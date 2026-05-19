import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frontend/src/App';
import type { Product, CartItem } from '../../src/frontend/src/types';

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Test Headphones',
    description: 'Great sound quality.',
    price: 79.99,
    category: 'Electronics',
    stock: 10,
    imageUrl: 'https://example.com/headphones.jpg',
  },
];

vi.mock('../../src/frontend/src/hooks/useProducts');
vi.mock('../../src/frontend/src/hooks/useCart');

import { useProducts } from '../../src/frontend/src/hooks/useProducts';
import { useCart } from '../../src/frontend/src/hooks/useCart';

const mockedUseProducts = vi.mocked(useProducts);
const mockedUseCart = vi.mocked(useCart);

function makeCart(overrides: Partial<ReturnType<typeof useCart>> = {}): ReturnType<typeof useCart> {
  return {
    items: [] as CartItem[],
    loading: false,
    error: null,
    totalPrice: 0,
    totalItems: 0,
    addItem: vi.fn().mockResolvedValue(undefined),
    updateQuantity: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
    getItemQuantity: vi.fn().mockReturnValue(0),
    ...overrides,
  };
}

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the header with shop name', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);

    expect(screen.getByText('Mock Shop')).toBeInTheDocument();
  });

  it('renders the hero banner', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);

    expect(screen.getByText(/discover quality products/i)).toBeInTheDocument();
  });

  it('renders the products section heading', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);

    expect(screen.getByRole('heading', { name: /our products/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: true, error: null });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: 'Network error' });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);

    expect(screen.getByText(/error: network error/i)).toBeInTheDocument();
  });

  it('renders product list when loaded', () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);

    expect(screen.getByText('Test Headphones')).toBeInTheDocument();
  });

  it('shows notification after adding to cart', async () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /add test headphones to cart/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('"Test Headphones" added to cart!');
  });

  it('shows error notification when add to cart fails', async () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart({
      addItem: vi.fn().mockRejectedValue(new Error('Server error')),
    }));

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /add test headphones to cart/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to add item to cart.');
  });

  it('cart badge reflects totalItems from useCart', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart({ totalItems: 4 }));

    render(<App />);

    expect(screen.getByRole('button', { name: /shopping cart with 4 items/i })).toBeInTheDocument();
  });

  it('opens cart drawer when cart button is clicked', async () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockedUseCart.mockReturnValue(makeCart());

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /shopping cart/i }));

    expect(screen.getByRole('dialog', { name: /shopping cart/i })).toBeInTheDocument();
  });
});
