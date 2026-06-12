import api from './axios';

export const getStoreAdmins = async () => {
  const response = await api.get('/users/admins');
  return response.data;
};

export const createStoreAdmin = async (data: { name: string; email: string; password: string; storeId?: number | null }) => {
  const response = await api.post('/users/admins', data);
  return response.data;
};

export const assignStoreAdmin = async (adminId: number, storeId: number | null) => {
  const response = await api.put(`/users/admins/${adminId}/assign`, { storeId });
  return response.data;
};
