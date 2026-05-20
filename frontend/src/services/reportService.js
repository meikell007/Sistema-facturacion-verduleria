import API from './api';

export const getSalesReport = async (startDate, endDate) => {
  const response = await API.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};

export const getDebtorsReport = async () => {
  const response = await API.get('/reports/debtors');
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await API.get('/reports/audit');
  return response.data;
};
