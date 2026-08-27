import { useState } from 'react';
import { X, CheckCircle2, ShoppingCart, ShoppingBag } from 'lucide-react';
import Button from './Button';
import { createOrder } from '../api/client';
import './CheckoutModal.css';

export default function CheckoutModal({ cartItems, cartTotal, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address: '',
    department: 'Atlántico',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderCompleted, setOrderCompleted] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Determine order_type: if all items are pet_catalog, it's pet_catalog; otherwise catalog
  const orderType = cartItems.every(i => i.category === 'pet_catalog') ? 'pet_catalog' : 'catalog';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fullAddress = `${formData.address.trim()}, ${formData.department}`;

    const items = cartItems.map(item => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image_url: item.image_url,
    }));

    try {
      const order = await createOrder({
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim(),
        address: fullAddress,
        order_type: orderType,
        total_amount: cartTotal,
        items,
      });
      setOrderCompleted(order);
      if (onSuccess) onSuccess(order);
    } catch (err) {
      setError(err.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {orderCompleted ? (
          <div className="modal-success">
            <CheckCircle2 size={48} className="modal-success-icon" />
            <h2 className="modal-title">¡Pedido Recibido!</h2>
            <p className="modal-desc">
              Gracias por tu compra, <strong>{orderCompleted.customer_name}</strong>. Ana se comunicará contigo vía WhatsApp ({orderCompleted.customer_phone}) para confirmar el envío hacia <strong>{orderCompleted.address}</strong>.
            </p>
            <div className="modal-summary">
              <span><strong>{orderCompleted.items ? orderCompleted.items.length : 0}</strong> {orderCompleted.items && orderCompleted.items.length === 1 ? 'producto' : 'productos'} en tu pedido</span>
              {orderCompleted.items && orderCompleted.items.map(item => (
                <span key={item.product_id} className="modal-summary-item">
                  {item.name} × {item.quantity} — {formatPrice(item.price * item.quantity)}
                </span>
              ))}
              <hr className="modal-summary-divider" />
              <span>Total: <strong>{formatPrice(orderCompleted.total_amount)}</strong></span>
              <small className="modal-note">* El valor del envío local será cotizado por Ana.</small>
            </div>
            <Button fullWidth onClick={onClose}>
              Entendido
            </Button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-badge">
                <ShoppingCart size={16} />
                <span>Finalizar Compra</span>
              </div>
              <h2 className="modal-title">Datos de Envío</h2>
              <div className="modal-cart-summary">
                {cartItems.map(item => (
                  <div key={item.product_id} className="modal-cart-item">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="modal-cart-item__img" />
                    ) : (
                      <div className="modal-cart-item__placeholder">
                        <ShoppingBag size={14} />
                      </div>
                    )}
                    <span className="modal-cart-item__name">{item.name}</span>
                    <span className="modal-cart-item__qty">×{item.quantity}</span>
                    <span className="modal-cart-item__price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="modal-cart-total">
                  <span>Total</span>
                  <span className="modal-price">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              {error && <div className="modal-error">{error}</div>}

              <div className="form__group">
                <label htmlFor="checkout_name">Nombre completo</label>
                <input 
                  required 
                  type="text" 
                  id="checkout_name" 
                  name="customer_name" 
                  value={formData.customer_name} 
                  onChange={handleChange} 
                  placeholder="Ej. María Pérez"
                />
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label htmlFor="checkout_email">Correo electrónico</label>
                  <input 
                    required 
                    type="email" 
                    id="checkout_email" 
                    name="customer_email" 
                    value={formData.customer_email} 
                    onChange={handleChange} 
                    placeholder="maria@ejemplo.com"
                  />
                </div>
                <div className="form__group">
                  <label htmlFor="checkout_phone">WhatsApp / Celular</label>
                  <input 
                    required 
                    type="tel" 
                    id="checkout_phone" 
                    name="customer_phone" 
                    value={formData.customer_phone} 
                    onChange={handleChange} 
                    placeholder="300 123 4567"
                  />
                </div>
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label htmlFor="checkout_address">Dirección</label>
                  <input 
                    required 
                    type="text" 
                    id="checkout_address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Calle 72 #45-10, Barranquilla"
                  />
                </div>
                <div className="form__group">
                  <label htmlFor="checkout_department">Departamento</label>
                  <select 
                    id="checkout_department" 
                    name="department" 
                    value={formData.department} 
                    onChange={handleChange}
                  >
                    <option value="Atlántico">Atlántico (Disponible)</option>
                  </select>
                </div>
              </div>

              <p className="modal-restriction">
                * Envíos disponibles únicamente en el departamento del <strong>Atlántico</strong>.
              </p>

              <div className="modal-actions">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading}
                >
                  {loading ? 'Confirmando...' : 'Confirmar Pedido'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
