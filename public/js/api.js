// API client for Wooking for Work
const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }
    
    if (response.status === 204) {
      return null;
    }
    
    return response.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('Network error', 0, { originalError: err.message });
  }
}

// Jobs API
const jobsApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    return request('GET', `/jobs${query ? '?' + query : ''}`);
  },
  
  get: (id) => request('GET', `/jobs/${id}`),
  
  create: (job) => request('POST', '/jobs', job),
  
  update: (id, updates) => request('PATCH', `/jobs/${id}`, updates),
  
  delete: (id) => request('DELETE', `/jobs/${id}`),
};

// Activities API
const activitiesApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    return request('GET', `/activities${query ? '?' + query : ''}`);
  },
  
  create: (activity) => request('POST', '/activities', activity),
  
  delete: (id) => request('DELETE', `/activities/${id}`),
};

// Runs API
const runsApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    return request('GET', `/runs${query ? '?' + query : ''}`);
  },
  
  get: (id) => request('GET', `/runs/${id}`),
  
  create: (run) => request('POST', '/runs', run),
  
  update: (id, updates) => request('PATCH', `/runs/${id}`, updates),
};

// Static data API
const staticApi = {
  getStates: () => request('GET', '/states'),
  getCommands: () => request('GET', '/commands'),
};

// Export to window for global access
window.API = { jobsApi, activitiesApi, runsApi, staticApi, ApiError };
