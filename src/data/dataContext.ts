import { createContext } from 'react';
import type { Exercise, Routine, WorkoutSession } from '../domain/types';
import type { QueryState } from '../hooks/useQuerySubscription';

export interface DataState {
  uid: string;
  exercises: QueryState<Exercise>;
  routines: QueryState<Routine>;
  /** All workouts, most recent first. Small documents (sets live in their own collection). */
  workouts: QueryState<WorkoutSession>;
}

export const DataContext = createContext<DataState | null>(null);
