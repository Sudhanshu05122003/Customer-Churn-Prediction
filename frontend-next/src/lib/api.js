const API_BASE = 'http://localhost:5000';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  me: () => apiRequest('/auth/me'),
};

export const churnApi = {
  getStats: () => apiRequest('/stats'),
  getHistory: () => apiRequest('/history'),
  getSchema: () => apiRequest('/schema'),
  predict: (features) => apiRequest('/predict', {
    method: 'POST',
    body: JSON.stringify(features),
  }),
  deletePrediction: (id) => apiRequest(`/history/${id}`, {
    method: 'DELETE',
  }),
  bulkPredict: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_BASE}/predict-bulk`, {
      method: 'POST',
      body: formData,
      headers,
    }).then(res => res.json());
  }
};
