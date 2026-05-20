import API from './api';

export const createInvoice = async (invoiceData) => {
  const response = await API.post('/invoices', invoiceData);
  return response.data;
};

export const getInvoices = async (filters = {}) => {
  const { search, tipo_pago, estado } = filters;
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (tipo_pago) params.append('tipo_pago', tipo_pago);
  if (estado) params.append('estado', estado);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await API.get(`/invoices${query}`);
  return response.data;
};

export const getInvoiceById = async (id) => {
  const response = await API.get(`/invoices/${id}`);
  return response.data;
};
