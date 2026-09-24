import { useMemo } from 'react';
import { groupExerciseSessions, sortSets, type ExerciseSession } from '../analytics/history';
import type { ExerciseSnapshot, WorkoutSession, WorkoutSet } from '../domain/types';
import { useExerciseSets } from './useSets';
import { useWorkoutsById } from './useWorkouts';

export interface WorkoutExerciseData {
  snapshot: ExerciseSnapshot;
  /** Sets logged in this workout, ordered. */
  todaySets: WorkoutSet[];
  /** Completed sessions before this workout, oldest first. */
  priorSessions: ExerciseSession[];
  previous: ExerciseSession | null;
}

/**
 * Loads, for every exercise of a workout, today's sets and its previous completed sessions.
 * One live query (per 30 exercises) feeds both, so a new set appears immediately — also offline.
 */
export function useWorkoutExercises(uid: string, workout: WorkoutSession) {
  const exerciseIds = useMemo(
    () => workout.exercises.map((e) => e.exerciseId),
    [workout.exercises],
  );
  const sets = useExerciseSets(uid, exerciseIds);
  const workoutsById = useWorkoutsById();

  const exercises = useMemo<WorkoutExerciseData[]>(() => {
    const byExercise = new Map<string, WorkoutSet[]>();
    for (const set of sets.data) {
      const list = byExercise.get(set.exerciseId);
      if (list) list.push(set);
      else byExercise.set(set.exerciseId, [set]);
    }
    return workout.exercises.map((snapshot) => {
      const all = byExercise.get(snapshot.exerciseId) ?? [];
      const priorSessions = groupExerciseSessions(all, workoutsById, {
        excludeWorkoutId: workout.id,
        before: workout.startedAt,
      });
      return {
        snapshot,
        todaySets: sortSets(all.filter((s) => s.workoutId === workout.id)),
        priorSessions,
        previous: priorSessions[priorSessions.length - 1] ?? null,
      };
    });
  }, [sets.data, workout, workoutsById]);

  return { exercises, loading: sets.loading, error: sets.error };
}
