export interface UserStats {
  streak: number;
  workoutsThisWeek: number;
  totalWorkouts: number;
  currentWeight?: number;
  goalWeight?: number;
}

export interface RecentSession {
  id: string;
  programName: string;
  date: string;
  durationMinutes: number;
}
