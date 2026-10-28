const normalizeUrl = (value, fallback) => {
  if (!value) return fallback;
  return value.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizeUrl(import.meta.env.VITE_API_URL, 'http://localhost:5005/api');
export const SOCKET_BASE_URL = API_BASE_URL.includes('/api')
  ? API_BASE_URL.replace(/\/api$/, '')
  : API_BASE_URL;

export const appConfig = {
  API_BASE_URL,
  SOCKET_BASE_URL,
};