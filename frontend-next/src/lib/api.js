const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';



export async function apiRequest(endpoint, options = {}, timeout = 10000) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(id);

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || (typeof payload.success === 'boolean' && !payload.success)) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error(payload.message || payload.error || `HTTP error! status: ${response.status}`);
    }

    // Auto-unwrap our standardized response
    if (payload && typeof payload.success === 'boolean') {
      return payload.data;
    }

    return payload;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
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
  toggleSavedStatus: (id) => apiRequest(`/history/${id}/save`, {
    method: 'POST',
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
    }).then(async res => {
        const payload = await res.json();
        if (!res.ok || (typeof payload.success === 'boolean' && !payload.success)) {
            throw new Error(payload.message || payload.error || 'API error');
        }
        return typeof payload.success === 'boolean' ? payload.data : payload;
    });
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
    }).then(async res => {
        const payload = await res.json();
        if (!res.ok || (typeof payload.success === 'boolean' && !payload.success)) {
            throw new Error(payload.message || payload.error || 'API error');
        }
        return typeof payload.success === 'boolean' ? payload.data : payload;
    });
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
    }).then(async res => {
        const payload = await res.json();
        if (!res.ok || (typeof payload.success === 'boolean' && !payload.success)) {
            throw new Error(payload.message || payload.error || 'API error');
        }
        return typeof payload.success === 'boolean' ? payload.data : payload;
    });
  }
};

