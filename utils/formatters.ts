/**
 * Format relative time. For timestamps older than 30 days, returns full date.
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}j`;
  // Plus de 30 jours → date complète
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Format a date string as localized French date.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format a date string as short French date (e.g. "15 jan").
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Format a chat timestamp: HH:MM for today, "Hier HH:MM" for yesterday,
 * "DD/MM HH:MM" for older messages.
 */
export function formatChatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const hhmm = date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayMidnight = new Date(todayMidnight.getTime() - 86_400_000);

  if (date >= todayMidnight) return hhmm;
  if (date >= yesterdayMidnight) return `Hier ${hhmm}`;
  return `${date.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit' })} ${hhmm}`;
}

/**
 * Format workout volume in kg.
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}t`;
  return `${volume}kg`;
}
