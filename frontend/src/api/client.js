const API_URL = 'http://localhost:8000';

function formatErrorMessage(errData, defaultMsg = 'Error en la solicitud') {
  if (!errData) return defaultMsg;
  if (typeof errData === 'string') return errData;
  if (typeof errData.detail === 'string') return errData.detail;
  if (Array.isArray(errData.detail)) {
    return errData.detail.map(d => d.msg ? d.msg.replace(/^Value error,\s*/i, '') : JSON.stringify(d)).join('. ');
  }
  if (errData.message) return errData.message;
  return defaultMsg;
}

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('ariani_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = formatErrorMessage(errorData, `Error ${res.status}: ${res.statusText}`);
    throw new Error(message);
  }
  return res.json();
}

// Auth
export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(formatErrorMessage(errorData, 'Credenciales incorrectas'));
  }
  return res.json();
}

// Products
export const getProducts = (category) => {
  const params = category ? `?category=${category}` : '';
  return apiFetch(`/products/${params}`);
};

export const getProduct = (id) => apiFetch(`/products/${id}`);
export const createProduct = (data) => apiFetch('/products/', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) => apiFetch(`/products/${id}`, { method: 'DELETE' });

export async function uploadProductImage(file) {
  const token = localStorage.getItem('ariani_token');
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_URL}/products/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(formatErrorMessage(errorData, 'Error al subir la imagen'));
  }
  return res.json();
}

// Orders
export const createOrder = (data) => {
  // Public endpoint
  return apiFetch('/orders/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getOrders = () => apiFetch('/orders/');
export const updateOrder = (id, data) => apiFetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteOrder = (id) => {
  const token = localStorage.getItem('ariani_token');
  return fetch(`${API_URL}/orders/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(res => {
    if (!res.ok) return res.json().then(d => { throw new Error(formatErrorMessage(d)); });
    return null;
  });
};

export const clientConfirmOrder = (id, action) => {
  return apiFetch(`/orders/${id}/client-confirm?action=${action}`, {
    method: 'POST'
  });
};

export const payOrderSuccess = (id, transactionId) => {
  return apiFetch(`/orders/${id}/pay-success?transaction_id=${transactionId}`, {
    method: 'POST'
  });
};

