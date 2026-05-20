import API from './api';

export const login = async (username, password) => {
  const response = await API.post('/auth/login', { username, password });
  if (response.data.token) {
    localStorage.setItem('eco_fruver_token', response.data.token);
    localStorage.setItem('eco_fruver_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logout = async () => {
  try {
    await API.post('/auth/logout');
  } catch (error) {
    console.error('Error al notificar cierre de sesión al servidor:', error);
  } finally {
    localStorage.removeItem('eco_fruver_token');
    localStorage.removeItem('eco_fruver_user');
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('eco_fruver_user');
  return user ? JSON.parse(user) : null;
};

export const registerUser = async (nombre, apellido, username, password, id_rol) => {
  const response = await API.post('/auth/register', { nombre, apellido, username, password, id_rol });
  return response.data;
};

export const listUsers = async () => {
  const response = await API.get('/auth/users');
  return response.data;
};
