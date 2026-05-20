import API from './api';

export const getClients = async (search = '') => {
  const response = await API.get(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  return response.data;
};

export const getClientById = async (id) => {
  const response = await API.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (clientData) => {
  const response = await API.post('/clients', clientData);
  return response.data;
};

export const updateClient = async (id, clientData) => {
  const response = await API.put(`/clients/${id}`, clientData);
  return response.data;
};

export const getClientHistory = async (id) => {
  const response = await API.get(`/clients/${id}/history`);
  return response.data;
};
