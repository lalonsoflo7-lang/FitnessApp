import { sortSets } from '../analytics/history';
import type { ExerciseSummary, WorkoutSession, WorkoutSet } from './types';

export interface WorkoutViewExercise {
  exerciseId: string;
  /** Name as it was on the day of the workout (snapshot), never the current name. */
  name: string;
  order: number;
  sets: WorkoutSet[];
  summary: ExerciseSummary | null;
}

/**
 * Rebuilds what happened in a workout exclusively from the workout's own snapshot and its sets.
 * It intentionally takes no routine or exercise catalogue: editing those can't change history.
 */
export function buildWorkoutView(
  workout: Pick<WorkoutSession, 'exercises' | 'summary'>,
  sets: readonly WorkoutSet[],
): WorkoutViewExercise[] {
  const sorted = sortSets(sets);
  const summaries = new Map((workout.summary?.exercises ?? []).map((e) => [e.exerciseId, e]));
  const view: WorkoutViewExercise[] = workout.exercises.map((snap) => ({
    exerciseId: snap.exerciseId,
    name: snap.name,
    order: snap.order,
    sets: sorted.filter((s) => s.exerciseId === snap.exerciseId),
    summary: summaries.get(snap.exerciseId) ?? null,
  }));
  // Defensive: sets whose exercise isn't in the snapshot still show, with their own snapshot name.
  const known = new Set(workout.exercises.map((e) => e.exerciseId));
  for (const set of sorted) {
    if (known.has(set.exerciseId)) continue;
    known.add(set.exerciseId);
    view.push({
      exerciseId: set.exerciseId,
      name: set.exerciseNameSnapshot,
      order: set.exerciseOrder,
      sets: sorted.filter((s) => s.exerciseId === set.exerciseId),
      summary: summaries.get(set.exerciseId) ?? null,
    });
  }
  return view;
}
