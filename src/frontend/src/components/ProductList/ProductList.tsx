import type { Product } from '../../types';
import { ProductCard } from '../ProductCard';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  getItemQuantity: (productId: number) => number;
}

export function ProductList({ products, onAddToCart, getItemQuantity }: ProductListProps) {
  if (products.length === 0) {
    return <p className="product-list__empty">No products available.</p>;
  }

  return (
    <ul className="product-list" aria-label="Product list">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} onAddToCart={onAddToCart} cartQuantity={getItemQuantity(product.id)} />
        </li>
      ))}
    </ul>
  );
}
