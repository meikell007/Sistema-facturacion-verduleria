import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de peticiones para inyectar el token JWT de forma automática
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eco_fruver_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para capturar errores de sesión expirada (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el backend responde 401, removemos la sesión local y redirigimos al login
      localStorage.removeItem('eco_fruver_token');
      localStorage.removeItem('eco_fruver_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
