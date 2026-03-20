import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from './api';

async function writeAndShare(content: string, filename: string): Promise<void> {
  const path = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Le partage de fichiers n\'est pas disponible sur cet appareil.');
  }
  await Sharing.shareAsync(path, { mimeType: getMimeType(filename) });
}

function getMimeType(filename: string): string {
  if (filename.endsWith('.csv')) return 'text/csv';
  if (filename.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

export async function exportSessionsCSV(): Promise<void> {
  const { data } = await api.get<string>('/export/workouts/csv', {
    responseType: 'text',
  });
  await writeAndShare(data, 'sessions.csv');
}

export async function exportSessionsJSON(): Promise<void> {
  const { data } = await api.get<unknown>('/export/workouts/json');
  const content = JSON.stringify(data, null, 2);
  await writeAndShare(content, 'sessions.json');
}

export async function exportPRsCSV(): Promise<void> {
  const { data } = await api.get<string>('/export/prs/csv', {
    responseType: 'text',
  });
  await writeAndShare(data, 'records.csv');
}
