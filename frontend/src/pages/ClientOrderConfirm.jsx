import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader, CreditCard } from 'lucide-react';
import { clientConfirmOrder, payOrderSuccess } from '../api/client';
import Button from '../components/Button';
import './ClientOrderConfirm.css';

const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY || 'pub_test_Q5yDA9xo65CqbCc4Cco6Zgbchm5wG4qn';

const loadWompiScript = () => {
  return new Promise((resolve) => {
    if (window.WidgetCheckout) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });
};

export default function ClientOrderConfirm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialAction = searchParams.get('action'); // 'accept' or 'reject'

  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error', 'paying', 'paid'
  const [action, setAction] = useState(initialAction);
  const [orderData, setOrderData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const handleAction = async (selectedAction) => {
    setAction(selectedAction);
    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await clientConfirmOrder(id, selectedAction);
      setOrderData(data);
      if (selectedAction === 'accept') {
        setStatus('success');
      } else {
        setStatus('cancelled');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Ocurrió un error al procesar tu solicitud.');
      setStatus('error');
    }
  };

  const handlePayment = async () => {
    if (!orderData) return;
    setStatus('loading');
    try {
      await loadWompiScript();
      
      const totalAmount = parseFloat(orderData.total_amount) + parseFloat(orderData.shipping_cost || 0);
      const totalCents = Math.round(totalAmount * 100);
      
      const checkout = new window.WidgetCheckout({
        currency: 'COP',
        amountInCents: totalCents,
        reference: `ARIANI-${id}-${Date.now()}`,
        publicKey: WOMPI_PUBLIC_KEY,
      });

      setStatus('success'); // keep success state behind the widget
      
      checkout.open(async (result) => {
        const transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
          setStatus('paying');
          try {
            await payOrderSuccess(id, transaction.id);
            setStatus('paid');
          } catch (err) {
            setErrorMessage(err.message || 'El pago fue aprobado pero ocurrió un error al actualizar el pedido. Ana lo resolverá manualmente.');
            setStatus('error');
          }
        } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
          setErrorMessage('La transacción fue rechazada o falló. Por favor intenta con otro medio de pago.');
          setStatus('success');
        }
      });
    } catch (err) {
      setErrorMessage('No se pudo cargar la pasarela de pagos Wompi.');
      setStatus('success');
    }
  };

  useEffect(() => {
    if (initialAction === 'accept' || initialAction === 'reject') {
      handleAction(initialAction);
    }
  }, [id, initialAction]);

  if (status === 'loading') {
    return (
      <main className="client-confirm container">
        <div className="client-confirm__card text-center">
          <Loader className="spinner" size={48} />
          <h2>Procesando...</h2>
          <p>Por favor espera un momento.</p>
        </div>
      </main>
    );
  }

  if (status === 'paying') {
    return (
      <main className="client-confirm container">
        <div className="client-confirm__card text-center">
          <Loader className="spinner" size={48} />
          <h2>Verificando Pago...</h2>
          <p>Wompi ha procesado la transacción, estamos actualizando el estado de tu pedido.</p>
        </div>
      </main>
    );
  }

  if (status === 'paid') {
    return (
      <main className="client-confirm container">
        <div className="client-confirm__card text-center">
          <CheckCircle size={56} className="color-success" />
          <h2>¡Pago Realizado con Éxito!</h2>
          <p>Tu pago ha sido registrado. Ana comenzará a trabajar en tu pedido lo antes posible.</p>
          <div style={{ marginTop: '20px' }}>
            <Button onClick={() => window.location.href = '/'}>Volver a la tienda</Button>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'cancelled') {
    return (
      <main className="client-confirm container">
        <div className="client-confirm__card text-center">
          <CheckCircle size={56} className="color-success" />
          <h2>Pedido Cancelado</h2>
          <p>Has cancelado el pedido correctamente. ¡Esperamos tejer para ti en el futuro!</p>
          <div style={{ marginTop: '20px' }}>
            <Button onClick={() => window.location.href = '/'}>Ir a la Página de Inicio</Button>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'success' && action === 'accept' && orderData) {
    const totalAmount = parseFloat(orderData.total_amount) + parseFloat(orderData.shipping_cost || 0);
    return (
      <main className="client-confirm container">
        <div className="client-confirm__card">
          <div className="text-center">
            <CheckCircle size={48} className="color-success" />
            <h2 style={{ marginTop: '10px' }}>¡Pedido Confirmado!</h2>
            <p>Has aceptado los valores de envío. Ahora puedes proceder al pago seguro a través de Wompi.</p>
          </div>

          <div style={{ background: 'var(--color-bg-cream)', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Productos:</span>
              <span>{formatPrice(orderData.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Envío (Atlántico):</span>
              <span>{formatPrice(orderData.shipping_cost)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: 'var(--color-accent-purple)' }}>
              <span>Total a pagar:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="error-text" style={{ marginBottom: '15px' }}>{errorMessage}</div>
          )}

          <Button 
            variant="primary" 
            fullWidth 
            onClick={handlePayment}
            icon={CreditCard}
          >
            Pagar con Wompi
          </Button>

          <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
            * Al dar clic se abrirá la pasarela segura de Wompi donde podrás pagar con PSE, Tarjeta de Crédito, Nequi o Bancolombia.
          </p>
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="client-confirm container">
        <div className="client-confirm__card text-center">
          <AlertTriangle size={56} className="color-error" />
          <h2>No se pudo procesar la solicitud</h2>
          <p className="error-text">{errorMessage}</p>
          <p>
            Si crees que esto es un error, por favor comunícate directamente con Ana por WhatsApp para confirmar tu pedido.
          </p>
          <div style={{ marginTop: '20px' }}>
            <Button onClick={() => setStatus('idle')}>Volver a Intentar</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="client-confirm container">
      <div className="client-confirm__card">
        <h2>Confirmación de Envío</h2>
        <p>Por favor, confirma si aceptas el valor de envío cotizado por Ana para proceder con la entrega de tu pedido.</p>
        
        <div className="client-confirm__actions">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => handleAction('accept')}
          >
            Aceptar Envío y Pedido
          </Button>
          <Button 
            variant="danger" 
            fullWidth 
            onClick={() => handleAction('reject')}
          >
            Rechazar y Cancelar Pedido
          </Button>
        </div>
      </div>
    </main>
  );
}
