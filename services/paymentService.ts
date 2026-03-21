import api from './api';

export async function getPortalUrl(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/credits/portal');
  if (!data?.url || typeof data.url !== 'string' || !data.url.startsWith('https://')) {
    throw new Error('Invalid payment portal URL received from server');
  }
  return data.url;
}
