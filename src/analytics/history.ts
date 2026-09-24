import type { WorkoutSession, WorkoutSet } from '../domain/types';

/** All the sets of one exercise performed in one workout. */
export interface ExerciseSession {
  workoutId: string;
  date: Date;
  routineName: string;
  sets: WorkoutSet[];
}

export function sortSets(sets: readonly WorkoutSet[]): WorkoutSet[] {
  return [...sets].sort(
    (a, b) =>
      a.exerciseOrder - b.exerciseOrder ||
      a.setNumber - b.setNumber ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

/**
 * Groups one exercise's sets into sessions, keeping only completed workouts (optionally only
 * those strictly before `before`). Result is chronological (oldest first).
 */
export function groupExerciseSessions(
  sets: readonly WorkoutSet[],
  workoutsById: ReadonlyMap<string, WorkoutSession>,
  options: { excludeWorkoutId?: string; before?: Date } = {},
): ExerciseSession[] {
  const byWorkout = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    if (set.workoutId === options.excludeWorkoutId) continue;
    const workout = workoutsById.get(set.workoutId);
    if (!workout || workout.status !== 'completed') continue;
    if (options.before && workout.startedAt.getTime() >= options.before.getTime()) continue;
    const list = byWorkout.get(set.workoutId);
    if (list) list.push(set);
    else byWorkout.set(set.workoutId, [set]);
  }
  const sessions: ExerciseSession[] = [];
  for (const [workoutId, list] of byWorkout) {
    const workout = workoutsById.get(workoutId)!;
    sessions.push({
      workoutId,
      date: workout.startedAt,
      routineName: workout.routineNameSnapshot,
      sets: sortSets(list),
    });
  }
  return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Groups any list of sets by exercise id. */
export function groupByExercise(sets: readonly WorkoutSet[]): Map<string, WorkoutSet[]> {
  const map = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    const list = map.get(set.exerciseId);
    if (list) list.push(set);
    else map.set(set.exerciseId, [set]);
  }
  return map;
}
