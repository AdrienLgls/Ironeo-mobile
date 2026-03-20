export interface Program {
  id: string;
  name: string;
  daysPerWeek: number;
  durationWeeks: number;
  description?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  instructions?: string;
  tips?: string;
}

export interface WorkoutSet {
  reps: number;
  weight?: number;
  durationSeconds?: number;
  completed: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  programId: string;
  programName: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  exercises: SessionExercise[];
}

export interface ProgramExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number | string;
  restSeconds?: number;
}

export interface ProgramDay {
  dayNumber: number;
  label: string;
  exercises: ProgramExercise[];
}

export interface ProgramDetail extends Program {
  days: ProgramDay[];
}
