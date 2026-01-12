export interface WorkoutSet {
  id: string;
  reps?: number;
  weight?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  distance?: number; // in km
  duration?: number; // in minutes
  completed: boolean;
}

export type ExerciseType = 'strength' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  date: string; // ISO string
  name: string;
  exercises: Exercise[];
  durationMinutes?: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  meta?: any;
}

export type View = 'day' | 'calendar' | 'stats';

export const DEFAULT_EXERCISES: string[] = [
  "Squat", "Bench Press", "Deadlift", "Overhead Press", 
  "Pull Up", "Dumbbell Row", "Lunges", "Leg Press", 
  "Face Pull", "Bicep Curl", "Tricep Extension", "Lateral Raise",
  "Push Up", "Dip", "Skullcrusher", "Calf Raise", "Bulgarian Split Squat",
  "Romanian Deadlift", "Incline Bench Press"
];

export const DEFAULT_CARDIO_EXERCISES: string[] = [
  "Running", "Cycling", "Rowing", "Jump Rope", "Elliptical", 
  "Stair Climber", "Swimming", "Walking", "Hiking", "Sprinting"
];

export const BODY_PART_MAPPING: Record<string, string> = {
  "Squat": "Legs",
  "Bench Press": "Chest",
  "Deadlift": "Back",
  "Overhead Press": "Shoulders",
  "Pull Up": "Back",
  "Dumbbell Row": "Back",
  "Lunges": "Legs",
  "Leg Press": "Legs",
  "Face Pull": "Shoulders",
  "Bicep Curl": "Arms",
  "Tricep Extension": "Arms",
  "Lateral Raise": "Shoulders",
  "Push Up": "Chest",
  "Dip": "Arms",
  "Skullcrusher": "Arms",
  "Calf Raise": "Legs",
  "Bulgarian Split Squat": "Legs",
  "Romanian Deadlift": "Legs",
  "Incline Bench Press": "Chest"
};

export const getBodyPart = (exerciseName: string): string => {
  return BODY_PART_MAPPING[exerciseName] || "Other";
};

// Epley Formula
export const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};