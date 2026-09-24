export const SET_TYPES = ['warmup', 'working', 'dropset'] as const;
export type SetType = (typeof SET_TYPES)[number];

export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Calentamiento',
  working: 'Efectiva',
  dropset: 'Drop set',
};

export const SET_TYPE_SHORT_LABELS: Record<SetType, string> = {
  warmup: 'Cal.',
  working: 'Efectiva',
  dropset: 'Drop',
};

export interface Exercise {
  id: string;
  name: string;
  notes: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Routine {
  id: string;
  name: string;
  /** Ordered list of exercise ids. Order in this array is the routine order. */
  exerciseIds: string[];
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Frozen copy of an exercise as it was when the workout started. */
export interface ExerciseSnapshot {
  exerciseId: string;
  name: string;
  order: number;
}

export type WorkoutStatus = 'active' | 'completed';

export interface WorkoutSession {
  id: string;
  sourceRoutineId: string | null;
  routineNameSnapshot: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: WorkoutStatus;
  exercises: ExerciseSnapshot[];
  /** Computed once when the workout is finished. Null while active. */
  summary: WorkoutSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseNameSnapshot: string;
  exerciseOrder: number;
  setNumber: number;
  /** Always stored in DEFAULT_WEIGHT_UNIT (kg). */
  weight: number;
  reps: number;
  setType: SetType;
  rir: number | null;
  /** Denormalised from the workout so per-exercise history can be ordered without joins. */
  workoutStartedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Minimal shape the metric functions need. Lets them run on drafts and stored sets alike. */
export interface SetLike {
  weight: number;
  reps: number;
  setType: SetType;
}

export type PrKind = 'weight' | 'reps' | 'e1rm' | 'volume';

export interface PersonalRecord {
  kind: PrKind;
  /** The new record value (kg for weight/e1rm/volume, reps for reps). */
  value: number;
  /** Previous best, or null when there was no comparable previous value. */
  previous: number | null;
  /** For rep records: the weight at which the rep record happened. */
  weight?: number;
}

export interface BestSet {
  weight: number;
  reps: number;
  e1rm: number | null;
}

export interface ExerciseSummary {
  exerciseId: string;
  name: string;
  order: number;
  totalSets: number;
  metricSets: number;
  volume: number;
  topWeight: number | null;
  bestE1rm: number | null;
  bestSet: BestSet | null;
  prs: PersonalRecord[];
  /** Comparison against the previous completed session of the same exercise. */
  comparison: SessionComparison | null;
}

export interface WorkoutSummary {
  durationSec: number;
  totalVolume: number;
  totalSets: number;
  metricSets: number;
  exerciseCount: number;
  prCount: number;
  exercises: ExerciseSummary[];
}

export interface SessionComparison {
  volumeDelta: number;
  topWeightDelta: number | null;
  e1rmDelta: number | null;
  currentMetricSets: number;
  previousMetricSets: number;
  /** False when the number of effective sets differs; volume deltas are then less meaningful. */
  sameStructure: boolean;
}
