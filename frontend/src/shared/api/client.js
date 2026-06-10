// Shared Data Fetching Hooks for Wooking for Work
// Compatible with both legacy and modern frontends

// Unified API client (works as ES module or window global)
const API_BASE = '/api';

// 401 handler — set by AuthContext to trigger redirect on session expiry
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.error || `HTTP ${response.status}`, response.status, errorData);
    }
    if (response.status === 204) return null;
    return response.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Network error', 0, { originalError: err.message });
  }
}

// API endpoint definitions
export const jobsApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const q = params.toString();
    return request('GET', `/jobs${q ? '?' + q : ''}`);
  },
  get: (id) => request('GET', `/jobs/${id}`),
  create: (job) => request('POST', '/jobs', job),
  update: (id, updates) => request('PATCH', `/jobs/${id}`, updates),
  delete: (id) => request('DELETE', `/jobs/${id}`),
};

export const activitiesApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const q = params.toString();
    return request('GET', `/activities${q ? '?' + q : ''}`);
  },
  create: (activity) => request('POST', '/activities', activity),
  delete: (id) => request('DELETE', `/activities/${id}`),
};

export const runsApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const q = params.toString();
    return request('GET', `/runs${q ? '?' + q : ''}`);
  },
  get: (id) => request('GET', `/runs/${id}`),
  create: (run) => request('POST', '/runs', run),
  update: (id, updates) => request('PATCH', `/runs/${id}`, updates),
};

export const staticApi = {
  getStates: () => request('GET', '/states'),
  getCommands: () => request('GET', '/commands'),
};

export const profileApi = {
  get: () => request('GET', '/profile'),
  update: (updates) => request('PATCH', '/profile', updates),
  importLinkedIn: (url) => request('POST', '/profile/linkedin', { url }),
};

// Auth API
export const authApi = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (email, password, name) => request('POST', '/auth/register', { email, password, name }),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET', '/auth/me'),
};

export const credentialsApi = {
  list: () => request('GET', '/credentials'),
  create: (provider, value, metadata) => request('POST', '/credentials', { provider, value, metadata }),
  delete: (provider) => request('DELETE', `/credentials/${encodeURIComponent(provider)}`),
};

// Legacy compatibility - attach to window
if (typeof window !== 'undefined') {
  window.API = { jobsApi, activitiesApi, runsApi, staticApi, profileApi, authApi, credentialsApi, ApiError, setUnauthorizedHandler };
}
