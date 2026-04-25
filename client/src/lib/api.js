import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

export const authApi = axios.create({
  baseURL: `${BASE}/auth`,
  withCredentials: true,
});

export default api;

