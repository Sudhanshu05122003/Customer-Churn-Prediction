const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';



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
  },
  analyzeColumns: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('analyze_only', 'true');
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_BASE}/train`, {
      method: 'POST',
      body: formData,
      headers,
    }).then(res => res.json());
  },
  trainModel: (file, featureCols, targetCol) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('feature_cols', featureCols.join(','));
    formData.append('target_col', targetCol);
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_BASE}/train`, {
      method: 'POST',
      body: formData,
      headers,
    }).then(res => res.json());
  }
};

