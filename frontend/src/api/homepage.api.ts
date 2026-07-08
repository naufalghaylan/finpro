import api from './axios';

export const subscribeNewsletter = async (email: string): Promise<string> => {
  const response = await api.post('/promotions/subscribe', { email });
  return response.data.message;
};
