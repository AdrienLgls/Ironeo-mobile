export interface Program {
  id: string;
  name: string;
  daysPerWeek: number;
  durationWeeks: number;
  description?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Full Body';

export interface Exercise {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
  equipment?: string;
  imageUrl?: string;
  muscleGroups: string[];
  description?: string;
  instructions?: string;
  tips?: string;
  isCustom?: boolean;
}

export interface CreateCustomExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
  description?: string;
}

export type SetType = 'Normal' | 'Warmup' | 'Dropset';

export interface WorkoutSet {
  reps: number;
  weight?: number;
  rpe?: number;
  type?: SetType;
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
  notes?: string;
  rpe?: number;
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
