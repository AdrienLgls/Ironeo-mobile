export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  pseudo?: string;
  bio?: string;
  weight?: number;
  height?: number;
  goal?: string;
  subscriptionStatus?: 'free' | 'premium' | 'premium_plus';
}

export interface NotificationSettings {
  workoutReminders: boolean;
  restDayReminders: boolean;
}

export interface UserStats {
  streak: number;
  workoutsThisWeek: number;
  totalWorkouts: number;
  currentWeight?: number;
  goalWeight?: number;
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  totalXP?: number;
  totalPRs?: number;
}

export interface RecentSession {
  id: string;
  programName: string;
  date: string;
  durationMinutes: number;
}

export interface NextWorkout {
  programName: string;
  dayLabel: string;
}
