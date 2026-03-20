import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from './api';

const BASE_URL = 'https://ironeo.com/api';

export interface ProgressPhoto {
  _id: string;
  url: string;
  category: 'front' | 'back' | 'side' | 'other';
  weight?: number;
  notes?: string;
  createdAt: string;
}

export interface PhotoCompare {
  first: ProgressPhoto | null;
  latest: ProgressPhoto | null;
  weightDelta?: number;
}

export async function getPhotos(category?: string): Promise<ProgressPhoto[]> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const url = category
      ? `${BASE_URL}/progress-photos?category=${encodeURIComponent(category)}`
      : `${BASE_URL}/progress-photos`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as ProgressPhoto[];
  } catch {
    return [];
  }
}

export async function uploadPhoto(
  uri: string,
  category: string,
  weight?: number,
  notes?: string,
): Promise<ProgressPhoto> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const formData = new FormData();
  formData.append('photo', { uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
  formData.append('category', category);
  if (weight !== undefined) formData.append('weight', String(weight));
  if (notes) formData.append('notes', notes);

  const res = await fetch(`${BASE_URL}/progress-photos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token ?? ''}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  return (await res.json()) as ProgressPhoto;
}

export async function deletePhoto(id: string): Promise<void> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const res = await fetch(`${BASE_URL}/progress-photos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });
  if (!res.ok) {
    throw new Error(`Delete failed: ${res.status}`);
  }
}

export async function getCompare(category: string): Promise<PhotoCompare> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const res = await fetch(
      `${BASE_URL}/progress-photos/compare?category=${encodeURIComponent(category)}`,
      {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      },
    );
    if (!res.ok) return { first: null, latest: null };
    return (await res.json()) as PhotoCompare;
  } catch {
    return { first: null, latest: null };
  }
}
