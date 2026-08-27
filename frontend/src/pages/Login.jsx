import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { login } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import logoImg from '../assets/logo.png';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { isAuthenticated, loginUser } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await login(username, password);
      loginUser(data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login container">
      <div className="login__card">
        <header className="login__header">
          <img src={logoImg} alt="Ariani" className="login__logo-img" />
          <h1 className="login__title">Acceso Administrativo</h1>
          <p className="login__subtitle">Inicia sesión para gestionar catálogo y pedidos.</p>
        </header>

        <form className="login__form" onSubmit={handleSubmit}>
          {error && <div className="login__error">{error}</div>}
          
          <div className="login__group">
            <label htmlFor="username">Usuario</label>
            <input 
              required 
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          
          <div className="login__group">
            <label htmlFor="password">Contraseña</label>
            <input 
              required 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </div>
    </main>
  );
}
