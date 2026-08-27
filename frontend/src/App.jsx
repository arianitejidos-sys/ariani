import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CustomOrder from './pages/CustomOrder';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientOrderConfirm from './pages/ClientOrderConfirm';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <CartDrawer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/mascotas" element={<Catalog />} />
          <Route path="/pedido-personalizado" element={<CustomOrder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pedido/confirmar/:id" element={<ClientOrderConfirm />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
