import api from './api';

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
    const url = category
      ? `/progress-photos?category=${encodeURIComponent(category)}`
      : '/progress-photos';
    const { data } = await api.get<ProgressPhoto[]>(url);
    return data || [];
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
  const formData = new FormData();
  formData.append('photo', { uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
  formData.append('category', category);
  if (weight !== undefined) formData.append('weight', String(weight));
  if (notes) formData.append('notes', notes);

  const { data } = await api.post<ProgressPhoto>('/progress-photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deletePhoto(id: string): Promise<void> {
  await api.delete(`/progress-photos/${id}`);
}

export async function getCompare(category: string): Promise<PhotoCompare> {
  try {
    const { data } = await api.get<PhotoCompare>(
      `/progress-photos/compare?category=${encodeURIComponent(category)}`,
    );
    return data;
  } catch {
    return { first: null, latest: null };
  }
}
