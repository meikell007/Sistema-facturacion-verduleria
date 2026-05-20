import API from './api';

export const registerPayment = async (id_factura, monto, observacion = '') => {
  const response = await API.post('/payments', { id_factura, monto, observacion });
  return response.data;
};

export const getPendingInvoicesByClient = async (clientId) => {
  const response = await API.get(`/payments/client/${clientId}`);
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await API.get('/payments/history');
  return response.data;
};
