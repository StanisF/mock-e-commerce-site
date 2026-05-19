import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartDrawer } from '../../../../src/frontend/src/components/CartDrawer';
import type { CartItem } from '../../../../src/frontend/src/types';

const mockItems: CartItem[] = [
  { productId: 1, productName: 'Wireless Headphones', unitPrice: 79.99, quantity: 2, totalPrice: 159.98 },
  { productId: 2, productName: 'Running Shoes', unitPrice: 59.99, quantity: 1, totalPrice: 59.99 },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  items: mockItems,
  totalPrice: 219.97,
  onUpdateQuantity: vi.fn(),
  onRemove: vi.fn(),
  onClear: vi.fn(),
};

describe('CartDrawer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the cart title', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByText('Your Cart')).toBeInTheDocument();
  });

  it('renders all cart item names', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
  });

  it('renders item unit prices', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByText('$79.99 each')).toBeInTheDocument();
    expect(screen.getByText('$59.99 each')).toBeInTheDocument();
  });

  it('renders item line totals', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByText('$159.98')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();
  });

  it('renders cart total', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByText('$219.97')).toBeInTheDocument();
  });

  it('renders item quantities', () => {
    render(<CartDrawer {...defaultProps} />);
    expect(screen.getByLabelText('Quantity: 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity: 1')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<CartDrawer {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /close cart/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(<CartDrawer {...defaultProps} onClose={onClose} />);
    await userEvent.click(document.querySelector('.cart-drawer__overlay')!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onUpdateQuantity with decremented value when − is clicked', async () => {
    const onUpdateQuantity = vi.fn();
    render(<CartDrawer {...defaultProps} onUpdateQuantity={onUpdateQuantity} />);
    await userEvent.click(screen.getByRole('button', { name: /decrease quantity of wireless headphones/i }));
    expect(onUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });

  it('calls onRemove when − is clicked on item with quantity 1', async () => {
    const onRemove = vi.fn();
    render(<CartDrawer {...defaultProps} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: /decrease quantity of running shoes/i }));
    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it('calls onUpdateQuantity with incremented value when + is clicked', async () => {
    const onUpdateQuantity = vi.fn();
    render(<CartDrawer {...defaultProps} onUpdateQuantity={onUpdateQuantity} />);
    await userEvent.click(screen.getByRole('button', { name: /increase quantity of wireless headphones/i }));
    expect(onUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('disables + button when item quantity is 5', () => {
    const maxItems: CartItem[] = [{ productId: 1, productName: 'Wireless Headphones', unitPrice: 79.99, quantity: 5, totalPrice: 399.95 }];
    render(<CartDrawer {...defaultProps} items={maxItems} totalPrice={399.95} />);
    expect(screen.getByRole('button', { name: /increase quantity of wireless headphones/i })).toBeDisabled();
  });

  it('calls onRemove when Remove button is clicked', async () => {
    const onRemove = vi.fn();
    render(<CartDrawer {...defaultProps} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: /remove wireless headphones from cart/i }));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('calls onClear when Clear cart is clicked', async () => {
    const onClear = vi.fn();
    render(<CartDrawer {...defaultProps} onClear={onClear} />);
    await userEvent.click(screen.getByRole('button', { name: /clear cart/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('shows empty state when no items', () => {
    render(<CartDrawer {...defaultProps} items={[]} totalPrice={0} />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear cart/i })).not.toBeInTheDocument();
  });

  it('does not render as visible when closed', () => {
    render(<CartDrawer {...defaultProps} isOpen={false} />);
    expect(document.querySelector('.cart-drawer__overlay')).not.toBeInTheDocument();
    expect(document.querySelector('.cart-drawer__panel--open')).not.toBeInTheDocument();
  });
});
