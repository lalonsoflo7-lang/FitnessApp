import { useMemo } from 'react';
import { useData } from '../data/useData';
import type { WorkoutSession } from '../domain/types';

export function useWorkoutsById(): Map<string, WorkoutSession> {
  const { workouts } = useData();
  return useMemo(() => new Map(workouts.data.map((w) => [w.id, w])), [workouts.data]);
}

/** The single in-progress workout, if any (the most recent one if several exist). */
export function useActiveWorkout(): WorkoutSession | null {
  const { workouts } = useData();
  return useMemo(() => workouts.data.find((w) => w.status === 'active') ?? null, [workouts.data]);
}

export function useCompletedWorkouts(): WorkoutSession[] {
  const { workouts } = useData();
  return useMemo(() => workouts.data.filter((w) => w.status === 'completed'), [workouts.data]);
}
