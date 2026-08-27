import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, ListOrdered, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Truck, DollarSign, X, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrders, getProducts, updateOrder, deleteOrder, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../api/client';
import Button from '../components/Button';
import './Dashboard.css';

const ORDER_STATUS_LABELS = {
  pendiente: 'Pendiente',
  cotizado_envio: 'Cotizado Envío',
  aceptado_por_cliente: 'Aceptado por Cliente',
  pago_realizado: 'Pago Realizado',
  en_proceso: 'En Proceso',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
  cancelado_timeout: 'Cancelado (Timeout)',
  rechazado: 'Rechazado',
};

const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS);

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Modal / Editing states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  // New product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '1',
    category: 'clothing',
    image_url: '',
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const data = await getOrders();
        setOrders(data);
      } else {
        const data = await getProducts();
        setProducts(data);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const showNotification = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg({ type: '', text: '' });
    }, 4000);
  };

  const handleEditOrderClick = (order) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setShippingCost(order.shipping_cost || '');
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSavingOrder(true);
    try {
      const payload = {
        status: orderStatus,
      };
      if (shippingCost !== '') {
        payload.shipping_cost = parseFloat(shippingCost);
      }
      const updated = await updateOrder(selectedOrder.id, payload);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      setSelectedOrder(null);
      showNotification('success', `Pedido de ${updated.customer_name} actualizado`);
    } catch (err) {
      showNotification('error', err.message || 'Error al actualizar pedido');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDeleteOrder = async (id, e) => {
    e.stopPropagation(); // Prevent opening the manage modal
    if (!window.confirm("¿Estás segura de archivar/eliminar este pedido? Esta acción no se puede deshacer.")) return;
    try {
      await deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      showNotification('success', 'Pedido archivado correctamente');
    } catch (err) {
      showNotification('error', err.message || 'Error al archivar el pedido');
    }
  };

  const handleProductImageChange = async (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { image_url } = await uploadProductImage(file);
      if (isEditing) {
        setEditingProduct(prev => ({ ...prev, image_url }));
      } else {
        setProductForm(prev => ({ ...prev, image_url }));
      }
      showNotification('success', 'Imagen subida correctamente');
    } catch (err) {
      showNotification('error', err.message || 'Error al subir imagen');
      e.target.value = '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock, 10),
        category: productForm.category,
        image_url: productForm.image_url.trim() || null,
      };
      const created = await createProduct(payload);
      setProducts(prev => [created, ...prev]);
      setShowProductModal(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        stock: '1',
        category: 'clothing',
        image_url: '',
      });
      showNotification('success', `Producto "${created.name}" creado con éxito`);
    } catch (err) {
      showNotification('error', err.message || 'Error al crear producto');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const payload = {
        name: editingProduct.name.trim(),
        description: editingProduct.description ? editingProduct.description.trim() : null,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.stock, 10),
        category: editingProduct.category,
        image_url: editingProduct.image_url ? editingProduct.image_url.trim() : null,
      };
      const updated = await updateProduct(editingProduct.id, payload);
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingProduct(null);
      showNotification('success', `Producto "${updated.name}" actualizado con éxito`);
    } catch (err) {
      showNotification('error', err.message || 'Error al actualizar producto');
    } finally {
      setSavingProduct(false);
    }
  };


  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`¿Estás segura de eliminar el producto "${name}"?`)) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showNotification('success', `Producto "${name}" eliminado`);
    } catch (err) {
      showNotification('error', err.message || 'Error al eliminar producto');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price || 0);
  };

  return (
    <main className="dashboard container">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Panel de Control — Ana</h1>
          <p className="dashboard__subtitle">Gestión de pedidos y catálogo en tiempo real</p>
        </div>
        {activeTab === 'products' && (
          <Button size="sm" icon={Plus} onClick={() => setShowProductModal(true)}>
            Nuevo Producto
          </Button>
        )}
      </header>

      {feedbackMsg.text && (
        <div className={`dashboard__banner dashboard__banner--${feedbackMsg.type}`}>
          {feedbackMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      <div className="dashboard__tabs">
        <button 
          className={`dashboard__tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ListOrdered size={18} /> Pedidos ({orders.length})
        </button>
        <button 
          className={`dashboard__tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} /> Catálogo ({products.length})
        </button>
      </div>

      <div className="dashboard__content">
        {loading ? (
          <div className="dashboard__loading">Cargando datos...</div>
        ) : activeTab === 'orders' ? (
          <div className="cards-grid">
            {orders.length === 0 ? (
              <div className="empty-state">No hay pedidos registrados todavía</div>
            ) : (
              orders.map(order => (
                <div 
                  key={order.id} 
                  className="order-card"
                  onClick={() => handleEditOrderClick(order)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Gestionar pedido de ${order.customer_name}`}
                >
                  <div className="order-card__header">
                    <div>
                      <div className="order-card__customer">{order.customer_name}</div>
                      <div className="order-card__date">{new Date(order.created_at).toLocaleDateString('es-CO')}</div>
                    </div>
                    <span className={`status-badge status-${order.status}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  <div className="order-card__collage">
                    {order.items && order.items.length > 0 ? (
                      order.items.slice(0, 4).map((item, idx) => (
                        item.image_url ? (
                          <img key={idx} src={item.image_url} alt={item.name} className="order-card__collage-img" title={item.name} />
                        ) : (
                          <div key={idx} className="order-card__collage-placeholder" title={item.name}>
                            <ShoppingBag size={20} />
                          </div>
                        )
                      ))
                    ) : (
                      <span className="order-type-tag">
                        {order.order_type === 'custom' ? 'Personalizado' : (order.order_type === 'pet_catalog' ? 'Mascotas' : 'Catálogo')}
                      </span>
                    )}
                    {order.items && order.items.length > 4 && (
                      <div className="order-card__collage-placeholder" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="order-card__footer">
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Total</div>
                      <div className="order-card__total">{formatPrice(order.total_amount)}</div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ fontSize: '0.75rem', textAlign: 'right' }}>
                        <span style={{ display: 'block', color: 'var(--color-text-secondary)' }}>Envío:</span>
                        {order.shipping_cost ? formatPrice(order.shipping_cost) : <em className="text-muted">Por cotizar</em>}
                      </div>
                      
                      {['entregado', 'cerrado', 'cancelado_timeout', 'rechazado'].includes(order.status) && (
                        <button 
                          className="table-action-btn table-action-btn--delete" 
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          title="Archivar pedido"
                          aria-label={`Archivar pedido de ${order.customer_name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="cards-grid">
            {products.length === 0 ? (
              <div className="empty-state">No hay productos en catálogo</div>
            ) : (
              products.map(product => (
                <div key={product.id} className="admin-product-card">
                  <div className="admin-product-card__img-wrapper">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="admin-product-card__img" loading="lazy" />
                    ) : (
                      <div className="admin-product-card__placeholder">
                        <ShoppingBag size={48} />
                      </div>
                    )}
                  </div>
                  <div className="admin-product-card__body">
                    <div className="admin-product-card__title" title={product.name}>{product.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="order-type-tag">
                        {product.category === 'pet_catalog' ? 'Mascotas' : 'Ropa'}
                      </span>
                      <span className={`stock-tag ${product.stock <= 0 ? 'stock-zero' : ''}`}>
                        {product.stock} un.
                      </span>
                    </div>
                    <div className="admin-product-card__footer">
                      <strong style={{ color: 'var(--color-accent-purple)' }}>{formatPrice(product.price)}</strong>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button 
                          className="table-action-btn" 
                          onClick={() => setEditingProduct(product)}
                          title="Editar producto"
                          aria-label={`Editar ${product.name}`}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="table-action-btn table-action-btn--delete" 
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          title="Eliminar producto"
                          aria-label={`Eliminar ${product.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Editar / Cotizar Pedido */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Cerrar modal">
              <X size={20} />
            </button>
            <h2 className="modal-title">Gestionar Pedido</h2>
            <div className="modal-subinfo">
              <p><strong>Cliente:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
              <p><strong>Dirección:</strong> {selectedOrder.address}</p>
              <p><strong>Tipo:</strong> {selectedOrder.order_type}</p>
              {selectedOrder.custom_description && (
                <p><strong>Descripción personalizada:</strong> {selectedOrder.custom_description}</p>
              )}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <p><strong>Productos:</strong></p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedOrder.items.map((item, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveOrder} className="modal-form">
              <div className="form__group">
                <label htmlFor="edit_status">Estado del Pedido</label>
                <select 
                  id="edit_status" 
                  value={orderStatus} 
                  onChange={e => setOrderStatus(e.target.value)}
                >
                  {ORDER_STATUSES.map(st => (
                    <option key={st} value={st}>{ORDER_STATUS_LABELS[st]}</option>
                  ))}
                </select>
              </div>

              <div className="form__group">
                <label htmlFor="edit_shipping">Costo de Envío (COP)</label>
                <input 
                  type="number" 
                  id="edit_shipping" 
                  value={shippingCost} 
                  onChange={e => setShippingCost(e.target.value)} 
                  placeholder="Ej. 12000"
                  min="0"
                  step="500"
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setSelectedOrder(null)} disabled={savingOrder}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={savingOrder}>
                  {savingOrder ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Producto */}
      {showProductModal && (
        <div className="modal-backdrop" onClick={() => setShowProductModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProductModal(false)} aria-label="Cerrar modal">
              <X size={20} />
            </button>
            <h2 className="modal-title">Agregar Producto</h2>
            
            <form onSubmit={handleCreateProduct} className="modal-form">
              <div className="form__group">
                <label htmlFor="prod_name">Nombre de la prenda / accesorio</label>
                <input 
                  required 
                  type="text" 
                  id="prod_name" 
                  value={productForm.name} 
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })} 
                  placeholder="Ej. Cardigan Lavanda"
                />
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label htmlFor="prod_category">Categoría</label>
                  <select 
                    id="prod_category" 
                    value={productForm.category} 
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="clothing">Ropa (Adulto/Niño)</option>
                    <option value="pet_catalog">Mascotas</option>
                  </select>
                </div>
                <div className="form__group">
                  <label htmlFor="prod_price">Precio (COP)</label>
                  <input 
                    required 
                    type="number" 
                    id="prod_price" 
                    value={productForm.price} 
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })} 
                    placeholder="85000"
                    min="0"
                  />
                </div>
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label htmlFor="prod_stock">Stock disponible</label>
                  <input 
                    required 
                    type="number" 
                    id="prod_stock" 
                    value={productForm.stock} 
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })} 
                    min="0"
                  />
                </div>
                <div className="form__group">
                  <label htmlFor="prod_image">Imagen del producto (Opcional)</label>
                  <input 
                    type="file"
                    id="prod_image" 
                    accept="image/*"
                    onChange={handleProductImageChange}
                    disabled={uploadingImage || savingProduct}
                  />
                  {uploadingImage && <small>Subiendo imagen...</small>}
                  {productForm.image_url && <small>Imagen lista para guardar</small>}
                  <input
                    type="url"
                    id="prod_image_url"
                    value={productForm.image_url}
                    onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="O pega una URL externa"
                  />
                </div>
              </div>

              <div className="form__group">
                <label htmlFor="prod_desc">Descripción</label>
                <textarea 
                  id="prod_desc" 
                  rows="3" 
                  value={productForm.description} 
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })} 
                  placeholder="Detalles sobre el tejido, material o color..."
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowProductModal(false)} disabled={savingProduct}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={savingProduct || uploadingImage}>
                  {savingProduct ? 'Creando...' : uploadingImage ? 'Subiendo...' : 'Crear Producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Editar Producto */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingProduct(null)} aria-label="Cerrar modal">
              <X size={20} />
            </button>
            <h2 className="modal-title">Editar Producto</h2>
            
            <form onSubmit={handleUpdateProduct} className="modal-form">
              <div className="form__group">
                <label htmlFor="edit_prod_name">Nombre de la prenda / accesorio</label>
                <input 
                  required 
                  type="text" 
                  id="edit_prod_name" 
                  value={editingProduct.name} 
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} 
                  placeholder="Ej. Cardigan Lavanda"
                />
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label htmlFor="edit_prod_category">Categoría</label>
                  <select 
                    id="edit_prod_category" 
                    value={editingProduct.category} 
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  >
                    <option value="clothing">Ropa (Adulto/Niño)</option>
                    <option value="pet_catalog">Mascotas</option>
                  </select>
                </div>
                <div className="form__group">
                  <label htmlFor="edit_prod_price">Precio (COP)</label>
                  <input 
                    required 
                    type="number" 
                    id="edit_prod_price" 
                    value={editingProduct.price} 
                    onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} 
                    placeholder="85000"
                    min="0"
                  />
                </div>
              </div>

              <div className="form__row">
                <div className="form__group">
                  <label htmlFor="edit_prod_stock">Stock disponible</label>
                  <input 
                    required 
                    type="number" 
                    id="edit_prod_stock" 
                    value={editingProduct.stock} 
                    onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} 
                    min="0"
                  />
                </div>
                <div className="form__group">
                  <label htmlFor="edit_prod_image">Imagen del producto (Opcional)</label>
                  <input 
                    type="file"
                    id="edit_prod_image" 
                    accept="image/*"
                    onChange={(e) => handleProductImageChange(e, true)}
                    disabled={uploadingImage || savingProduct}
                  />
                  {uploadingImage && <small>Subiendo imagen...</small>}
                  {editingProduct.image_url && <small>Imagen lista para guardar</small>}
                  <input
                    type="url"
                    id="edit_prod_image_url"
                    value={editingProduct.image_url || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                    placeholder="O pega una URL externa"
                  />
                </div>
              </div>

              <div className="form__group">
                <label htmlFor="edit_prod_desc">Descripción</label>
                <textarea 
                  id="edit_prod_desc" 
                  rows="3" 
                  value={editingProduct.description || ''} 
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} 
                  placeholder="Detalles sobre el tejido, material o color..."
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)} disabled={savingProduct}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={savingProduct || uploadingImage}>
                  {savingProduct ? 'Guardando...' : uploadingImage ? 'Subiendo...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
