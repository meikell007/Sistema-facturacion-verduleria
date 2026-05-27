import API from './api';

export const getClients = async (search = '', includeInactive = false) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (includeInactive) params.append('includeInactive', 'true');
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await API.get(`/clients${query}`);
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