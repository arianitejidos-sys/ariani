import { ShoppingBag, ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import ProductDetailModal from './ProductDetailModal';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const [justAdded, setJustAdded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const isInCart = cartItems.some(item => item.product_id === product.id);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <>
      <div className="product-card" onClick={() => setShowDetail(true)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
        <div className="product-card__image-container">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="product-card__image"
              loading="lazy"
            />
          ) : (
            <div className="product-card__placeholder">
              <ShoppingBag size={48} className="product-card__placeholder-icon" />
            </div>
          )}
          {product.stock <= 0 && (
            <span className="product-card__badge product-card__badge--soldout">Agotado</span>
          )}
        </div>
        
        <div className="product-card__content">
          <h3 className="product-card__title">{product.name}</h3>
          {product.description && (
            <p className="product-card__description">{product.description}</p>
          )}
          
          <div className="product-card__footer">
            <span className="product-card__price">{formatPrice(product.price)}</span>
            {isAuthenticated ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Vista Admin</span>
            ) : (
              <Button 
                size="sm" 
                disabled={product.stock <= 0}
                variant={justAdded ? 'success' : isInCart ? 'outline' : 'primary'}
                aria-label={`Agregar ${product.name} al carrito`}
                onClick={handleAddToCart}
                icon={justAdded ? Check : ShoppingCart}
              >
                {justAdded ? '¡Agregado!' : isInCart ? 'Agregar otro' : 'Agregar'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {showDetail && (
        <ProductDetailModal product={product} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
