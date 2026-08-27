import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getProducts } from '../api/client';
import ProductCard from '../components/ProductCard';
import './Catalog.css';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  const isPets = location.pathname === '/mascotas';
  const category = isPets ? 'pet_catalog' : 'clothing';
  
  useEffect(() => {
    setLoading(true);
    getProducts(category)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <main className="catalog container">
      <header className="catalog__header">
        <h1 className="catalog__title">
          {isPets ? 'Catálogo de Mascotas' : 'Catálogo de Productos'}
        </h1>
        <p className="catalog__subtitle">
          {isPets 
            ? 'Accesorios y prendas tejidas a mano para tus peludos.' 
            : 'Explora nuestra colección de prendas y accesorios tejidos a mano.'}
        </p>
      </header>

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="catalog__empty">
          <p>No hay productos disponibles en esta categoría en este momento.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
