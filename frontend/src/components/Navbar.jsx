import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, ShoppingCart, Home, PawPrint, Paintbrush, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logoImg from '../assets/logo.png';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { cartCount, openCart } = useCart();
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" role="navigation" aria-label="Navegación principal">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand" onClick={closeMenu}>
          <img src={logoImg} alt="Ariani Logo" className="navbar__logo-img" />
          <div className="navbar__brand-text">
            <span className="navbar__logo-text">ARIANI</span>
            <span className="navbar__logo-tagline">Productos tejidos a mano</span>
          </div>
        </Link>

        <div className="navbar__right-actions">
          {/* Cart button — hide if admin */}
          {!isAuthenticated && (
            <button
              className="navbar__cart-btn"
              onClick={openCart}
              aria-label={`Carrito de compras, ${cartCount} artículos`}
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="navbar__cart-badge">{cartCount}</span>}
            </button>
          )}

          <button 
            className="navbar__toggle" 
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`navbar__menu ${isOpen ? 'navbar__menu--open' : ''}`}>
          <Link 
            to="/" 
            className={`navbar__link ${isActive('/') ? 'navbar__link--active' : ''}`}
            onClick={closeMenu}
          >
            <Home size={18} />
            <span>Inicio</span>
          </Link>
          <Link 
            to="/catalogo" 
            className={`navbar__link ${isActive('/catalogo') ? 'navbar__link--active' : ''}`}
            onClick={closeMenu}
          >
            <ShoppingBag size={18} />
            <span>Catálogo</span>
          </Link>
          <Link 
            to="/mascotas" 
            className={`navbar__link ${isActive('/mascotas') ? 'navbar__link--active' : ''}`}
            onClick={closeMenu}
          >
            <PawPrint size={18} />
            <span>Mascotas</span>
          </Link>
          <Link 
            to="/pedido-personalizado" 
            className={`navbar__link ${isActive('/pedido-personalizado') ? 'navbar__link--active' : ''}`}
            onClick={closeMenu}
          >
            <Paintbrush size={18} />
            <span>Personalizado</span>
          </Link>

          <div className="navbar__divider" />

          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className={`navbar__link ${isActive('/dashboard') ? 'navbar__link--active' : ''}`}
                onClick={closeMenu}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <button className="navbar__link navbar__link--logout" onClick={() => { logout(); closeMenu(); }}>
                <LogOut size={18} />
                <span>Salir</span>
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className={`navbar__link ${isActive('/login') ? 'navbar__link--active' : ''}`}
              onClick={closeMenu}
            >
              <LogIn size={18} />
              <span>Admin</span>
            </Link>
          )}
        </div>
      </div>

      {isOpen && <div className="navbar__backdrop" onClick={closeMenu} />}
    </nav>
  );
}
