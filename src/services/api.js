import { API_BASE_URL } from '../config';

// API Service for Women Safety App — Real Backend Only (No Simulation)
const API_URL = API_BASE_URL;

// HTTP request wrapper with auth token injection and error handling
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, config);
  } catch (err) {
    console.error(`Fetch failed from: ${API_URL}${endpoint}`, err);
    throw err;
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized - Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error (${response.status})`);
  }

  return await response.json();
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
};
