import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authApi = axios.create({
  baseURL: '/auth',
  withCredentials: true,
});

export default api;
