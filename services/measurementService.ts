import api from './api';

export interface Measurement {
  _id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulders?: number;
  bicepsLeft?: number;
  bicepsRight?: number;
  thighLeft?: number;
  thighRight?: number;
  notes?: string;
}

export interface MeasurementTrends {
  measurements: Measurement[];
  latestDeltas: Record<string, number>;
}

export async function getMeasurements(months?: number): Promise<MeasurementTrends> {
  try {
    const params = months !== undefined ? { months } : { months: 6 };
    const { data } = await api.get<MeasurementTrends>('/measurements/trends', { params });
    return data;
  } catch {
    return { measurements: [], latestDeltas: {} };
  }
}

export async function addMeasurement(data: Partial<Measurement>): Promise<Measurement> {
  const response = await api.post<Measurement>('/measurements', data);
  return response.data;
}

export async function deleteMeasurement(id: string): Promise<void> {
  await api.delete(`/measurements/${id}`);
}
