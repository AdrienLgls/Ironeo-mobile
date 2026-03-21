import api from './api';

export async function getPortalUrl(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/credits/portal');
  return data.url;
}
