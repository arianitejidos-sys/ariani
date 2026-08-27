import logoImg from '../assets/logo.png';
import './Footer.css';

function InstagramIcon({ size = 24, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer__inner">
        <div className="footer__brand">
          <img src={logoImg} alt="Ariani" className="footer__logo-img" />
          <div className="footer__brand-text">
            <span className="footer__logo-text">ARIANI</span>
            <span className="footer__logo-tagline">Productos tejidos a mano</span>
          </div>
        </div>
        
        <div className="footer__social">
          <a href="https://www.instagram.com/arianicrochet" target="_blank" rel="noopener noreferrer" aria-label="Instagram de Ariani" className="footer__social-link">
            <InstagramIcon size={24} />
          </a>
        </div>
        
        <div className="footer__copy">
          &copy; {currentYear} Ariani. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
