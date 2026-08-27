import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import CheckoutModal from './CheckoutModal';
import './CartDrawer.css';

export default function CartDrawer() {
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    closeCart,
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!isCartOpen && !showCheckout) return null;

  return (
    <>
      {isCartOpen && (
        <>
          <div className="cart-drawer-backdrop" onClick={closeCart} />
          <aside className="cart-drawer" role="dialog" aria-label="Carrito de compras">
            {/* Header */}
            <div className="cart-drawer__header">
              <h2 className="cart-drawer__title">
                <ShoppingCart size={20} />
                Mi Carrito
                {cartCount > 0 && <span className="cart-drawer__count">{cartCount}</span>}
              </h2>
              <button className="cart-drawer__close" onClick={closeCart} aria-label="Cerrar carrito">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="cart-drawer__body">
              {cartItems.length === 0 ? (
                <div className="cart-drawer__empty">
                  <ShoppingBag size={56} className="cart-drawer__empty-icon" />
                  <p>Tu carrito está vacío</p>
                  <small>Explora el catálogo y agrega productos.</small>
                </div>
              ) : (
                cartItems.map(item => (
                  <div className="cart-item" key={item.product_id}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="cart-item__image" />
                    ) : (
                      <div className="cart-item__placeholder">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                    <div className="cart-item__info">
                      <span className="cart-item__name">{item.name}</span>
                      <span className="cart-item__price">{formatPrice(item.price)}</span>
                      <div className="cart-item__controls">
                        <button
                          className="cart-item__qty-btn"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="cart-item__qty">{item.quantity}</span>
                        <button
                          className="cart-item__qty-btn"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="cart-item__remove"
                      onClick={() => removeFromCart(item.product_id)}
                      aria-label={`Eliminar ${item.name} del carrito`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="cart-drawer__footer">
                <div className="cart-drawer__summary">
                  <span className="cart-drawer__summary-label">Subtotal</span>
                  <span className="cart-drawer__summary-total">{formatPrice(cartTotal)}</span>
                </div>
                <p className="cart-drawer__shipping-note">
                  * El costo de envío será cotizado por Ana después de tu pedido.
                </p>
                <div className="cart-drawer__actions">
                  {isAuthenticated ? (
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                      <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '4px' }}>
                        Las administradoras no pueden hacer pedidos.
                      </p>
                      <Button fullWidth variant="primary" disabled>Proceder al Pago</Button>
                    </div>
                  ) : (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => {
                        closeCart();
                        setShowCheckout(true);
                      }}
                    >
                      Proceder al Pago
                    </Button>
                  )}
                  <button className="cart-drawer__clear-btn" onClick={clearCart}>
                    Vaciar carrito
                  </button>
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {showCheckout && (
        <CheckoutModal
          cartItems={cartItems}
          cartTotal={cartTotal}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            clearCart();
          }}
        />
      )}
    </>
  );
}
