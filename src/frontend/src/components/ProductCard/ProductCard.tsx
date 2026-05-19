import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity?: number;
}

export function ProductCard({ product, onAddToCart, cartQuantity = 0 }: ProductCardProps) {
  const isMaxQuantity = cartQuantity >= 5;
  return (
    <article className="product-card">
      <div className="product-card__image-wrapper">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-card__image"
          width={300}
          height={300}
          loading="lazy"
        />
      </div>
      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h2 className="product-card__name">{product.name}</h2>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__price">
            ${product.price.toFixed(2)}
          </span>
          <button
            className="product-card__button"
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0 || isMaxQuantity}
            aria-label={
              product.stock === 0
                ? 'Out of Stock'
                : isMaxQuantity
                ? 'Max quantity reached'
                : `Add ${product.name} to cart`
            }
          >
            {product.stock === 0 || isMaxQuantity ? '✕' : '+'}
          </button>
        </div>
      </div>
    </article>
  );
}
