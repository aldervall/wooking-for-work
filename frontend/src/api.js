const API_BASE = '/api';

export class ApiError extends Error {
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
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.error || `HTTP ${response.status}`, response.status, errorData);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const jobsApi = {
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

export const activitiesApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    return request('GET', `/activities${query ? '?' + query : ''}`);
  },
  create: (activity) => request('POST', '/activities', activity),
  delete: (id) => request('DELETE', `/activities/${id}`),
};

export const runsApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString();
    return request('GET', `/runs${query ? '?' + query : ''}`);
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
  update: (data) => request('PATCH', '/profile', data),
  delete: () => request('DELETE', '/profile'),
  importLinkedIn: (url) => request('POST', '/profile/linkedin', { url }),
  importStatus: () => request('GET', '/profile/import-status'),
};
