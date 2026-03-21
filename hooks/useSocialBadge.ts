import { useState, useEffect } from 'react';
import api from '../services/api';

type PendingResponse = { count: number } | { _id: string }[];

export function useSocialBadge() {
  const [badgeCount, setBadgeCount] = useState(0);

  async function fetchBadgeCount() {
    try {
      const { data } = await api.get<PendingResponse>('/friends/requests/pending');
      setBadgeCount(Array.isArray(data) ? data.length : (data.count ?? 0));
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    fetchBadgeCount();
    const interval = setInterval(fetchBadgeCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return { badgeCount, clearBadge: () => setBadgeCount(0) };
}
