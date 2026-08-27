import { X, ShoppingBag, ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import './ProductDetailModal.css';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const [justAdded, setJustAdded] = useState(false);

  const isInCart = cartItems.some(item => item.product_id === product.id);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  if (!product) return null;

  return (
    <div className="pdm-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Detalle de ${product.name}`}>
      <div className="pdm-card" onClick={e => e.stopPropagation()}>
        <button className="pdm-close" onClick={onClose} aria-label="Cerrar detalle">
          <X size={22} />
        </button>

        <div className="pdm-layout">
          {/* Image */}
          <div className="pdm-image-wrapper">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="pdm-image" />
            ) : (
              <div className="pdm-image-placeholder">
                <ShoppingBag size={72} />
              </div>
            )}
            {product.stock <= 0 && (
              <span className="pdm-badge-soldout">Agotado</span>
            )}
          </div>

          {/* Info */}
          <div className="pdm-info">
            <div className="pdm-category">
              {product.category === 'pet_catalog' ? '🐾 Mascotas' : '👗 Ropa & Accesorios'}
            </div>
            <h2 className="pdm-title">{product.name}</h2>
            
            {product.description && (
              <p className="pdm-description">{product.description}</p>
            )}

            <div className="pdm-price-row">
              <span className="pdm-price">{formatPrice(product.price)}</span>
              <span className={`pdm-stock ${product.stock <= 0 ? 'pdm-stock--zero' : ''}`}>
                {product.stock > 0 ? `${product.stock} disponible${product.stock > 1 ? 's' : ''}` : 'Sin stock'}
              </span>
            </div>

            <div className="pdm-divider" />

            {isAuthenticated ? (
              <div className="pdm-admin-note">
                <ShoppingBag size={16} />
                <span>Vista de administrador — compra desactivada</span>
              </div>
            ) : (
              <Button
                fullWidth
                size="lg"
                disabled={product.stock <= 0}
                variant={justAdded ? 'success' : isInCart ? 'outline' : 'primary'}
                onClick={handleAddToCart}
                icon={justAdded ? Check : ShoppingCart}
              >
                {justAdded ? '¡Agregado al carrito!' : isInCart ? 'Agregar otro al carrito' : 'Agregar al carrito'}
              </Button>
            )}

            <p className="pdm-shipping-note">
              * El costo de envío será cotizado por Ana tras tu pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
