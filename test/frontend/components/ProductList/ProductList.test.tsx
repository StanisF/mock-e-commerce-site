import { render, screen } from '@testing-library/react';
import { ProductList } from '../../../../src/frontend/src/components/ProductList';
import type { Product } from '../../../../src/frontend/src/types';

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Headphones',
    description: 'Noise cancelling.',
    price: 79.99,
    category: 'Electronics',
    stock: 10,
    imageUrl: 'https://example.com/1.jpg',
  },
  {
    id: 2,
    name: 'Running Shoes',
    description: 'Lightweight shoes.',
    price: 59.99,
    category: 'Footwear',
    stock: 5,
    imageUrl: 'https://example.com/2.jpg',
  },
];

describe('ProductList', () => {
  it('renders all products', () => {
    render(<ProductList products={mockProducts} onAddToCart={() => {}} getItemQuantity={() => 0} />);
    expect(screen.getByText('Headphones')).toBeInTheDocument();
    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
  });

  it('shows empty message when no products', () => {
    render(<ProductList products={[]} onAddToCart={() => {}} getItemQuantity={() => 0} />);
    expect(screen.getByText(/no products available/i)).toBeInTheDocument();
  });

  it('renders a list with correct number of items', () => {
    render(<ProductList products={mockProducts} onAddToCart={() => {}} getItemQuantity={() => 0} />);
    const list = screen.getByRole('list', { name: /product list/i });
    expect(list.children).toHaveLength(mockProducts.length);
  });

  it('forwards cartQuantity from getItemQuantity to ProductCard', () => {
    // Product 1 has 5 in cart — its Add button should be disabled
    render(
      <ProductList
        products={mockProducts}
        onAddToCart={() => {}}
        getItemQuantity={(id) => (id === 1 ? 5 : 0)}
      />
    );
    expect(screen.getByRole('button', { name: /max quantity reached/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /add running shoes to cart/i })).not.toBeDisabled();
  });
});
