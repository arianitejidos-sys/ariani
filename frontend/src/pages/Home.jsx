import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, PawPrint, Paintbrush } from 'lucide-react';
import { getProducts } from '../api/client';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import './Home.css';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(data => {
        if (Array.isArray(data)) {
          setFeatured(data.slice(0, 4));
        }
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="home">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="hero__eyebrow">ARIANI — 100% Crochet Artesanal</span>
            <h1 className="hero__title">Tejidos con amor, diseñados para ti</h1>
            <p className="hero__subtitle">
              Prendas y accesorios únicos tejidos a mano en Barranquilla. Diseños exclusivos y pedidos personalizados con entrega en todo el Atlántico.
            </p>
            <div className="hero__actions">
              <Link to="/catalogo">
                <Button size="lg" icon={ShoppingBag}>Ver Catálogo</Button>
              </Link>
              <Link to="/pedido-personalizado">
                <Button size="lg" variant="secondary" icon={Paintbrush}>Pedido a Medida</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías destacadas */}
      <section className="categories container">
        <div className="category-cards">
          <Link to="/catalogo" className="category-card">
            <div className="category-card__icon">
              <ShoppingBag size={28} />
            </div>
            <div className="category-card__text">
              <h3>Ropa y Accesorios</h3>
              <p>Tops, blusas, chalecos y bufandas tejidas a mano.</p>
            </div>
            <ArrowRight size={20} className="category-card__arrow" />
          </Link>

          <Link to="/mascotas" className="category-card category-card--pets">
            <div className="category-card__icon">
              <PawPrint size={28} />
            </div>
            <div className="category-card__text">
              <h3>Línea Mascotas</h3>
              <p>Ropita y accesorios suaves para perritos y gatitos.</p>
            </div>
            <ArrowRight size={20} className="category-card__arrow" />
          </Link>
        </div>
      </section>

      {/* Novedades */}
      <section className="section container">
        <div className="section__header">
          <div>
            <h2 className="section__title">Novedades y Favoritos</h2>
            <p className="section__subtitle">Piezas listas para entrega inmediata</p>
          </div>
          <Link to="/catalogo" className="section__link">
            Ver todo <ArrowRight size={16} />
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="home-empty">
            <p>Aún no hay productos en exhibición.</p>
          </div>
        ) : (
          <div className="product-grid">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Banner Pedido Personalizado */}
      <section className="custom-banner container">
        <div className="custom-banner__inner">
          <div className="custom-banner__content">
            <div className="custom-banner__badge">
              <Paintbrush size={18} />
              <span>Diseños Exclusivos</span>
            </div>
            <h2>¿Tienes una idea en mente?</h2>
            <p>Ana teje tus prendas personalizadas según tus medidas, colores y fotos de referencia. Solicita una cotización rápida.</p>
            <Link to="/pedido-personalizado">
              <Button variant="secondary" size="md">
                Cotizar Mi Diseño
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
