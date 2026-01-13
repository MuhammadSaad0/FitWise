export interface WorkoutSet {
  id: string;
  reps?: number;
  weight?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  distance?: number; // in km or miles depending on user setting
  duration?: number; // in minutes
  completed: boolean;
}

export type ExerciseType = 'strength' | 'cardio';
export type UnitSystem = 'metric' | 'imperial';

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
  "Romanian Deadlift", "Incline Bench Press", "Hammer Curl", "Preacher Curl",
  "Leg Extension", "Leg Curl", "Plank", "Crunch", "Russian Twist", "Hanging Leg Raise",
  "Cable Fly", "Lat Pulldown", "Seated Row", "Front Raise", "Reverse Fly", "Wrist Curl"
];

export const DEFAULT_CARDIO_EXERCISES: string[] = [
  "Running", "Cycling", "Rowing", "Jump Rope", "Elliptical", 
  "Stair Climber", "Swimming", "Walking", "Hiking", "Sprinting"
];

export const VALID_BODY_PARTS = [
  "Abs", "Back", "Biceps", "Chest", "Forearms", "Legs", "Shoulders", "Triceps", "Cardio"
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
  "Bicep Curl": "Biceps",
  "Tricep Extension": "Triceps",
  "Lateral Raise": "Shoulders",
  "Push Up": "Chest",
  "Dip": "Triceps",
  "Skullcrusher": "Triceps",
  "Calf Raise": "Legs",
  "Bulgarian Split Squat": "Legs",
  "Romanian Deadlift": "Legs",
  "Incline Bench Press": "Chest",
  "Hammer Curl": "Biceps",
  "Preacher Curl": "Biceps",
  "Leg Extension": "Legs",
  "Leg Curl": "Legs",
  "Plank": "Abs",
  "Crunch": "Abs",
  "Russian Twist": "Abs",
  "Hanging Leg Raise": "Abs",
  "Cable Fly": "Chest",
  "Lat Pulldown": "Back",
  "Seated Row": "Back",
  "Front Raise": "Shoulders",
  "Reverse Fly": "Shoulders",
  "Wrist Curl": "Forearms",
  "Chin Up": "Back"
};

export const getBodyPart = (exerciseName: string, customMapping?: Record<string, string>): string => {
  if (DEFAULT_CARDIO_EXERCISES.includes(exerciseName)) return "Cardio";
  if (customMapping && customMapping[exerciseName]) {
    return customMapping[exerciseName];
  }
  return BODY_PART_MAPPING[exerciseName] || "Other";
};

// Epley Formula
export const calculateOneRepMax = (weight: number, reps: number): number => {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};