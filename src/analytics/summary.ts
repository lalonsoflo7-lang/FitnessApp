import type {
  ExerciseSnapshot,
  ExerciseSummary,
  SetLike,
  WorkoutSet,
  WorkoutSummary,
} from '../domain/types';
import { roundTo } from '../domain/validation';
import { compareSessions } from './compare';
import { groupByExercise, sortSets } from './history';
import { bestE1rm, bestSet, metricSets, topWeight, volume } from './metrics';
import { detectSessionPRs } from './prs';

/**
 * Builds the summary stored on a workout when it is finished.
 * `priorSessionsByExercise` holds, per exercise, the previous completed sessions in
 * chronological order (oldest first) — never including the workout being finished.
 */
export function buildWorkoutSummary(input: {
  startedAt: Date;
  finishedAt: Date;
  exercises: readonly ExerciseSnapshot[];
  sets: readonly WorkoutSet[];
  priorSessionsByExercise: ReadonlyMap<string, readonly (readonly SetLike[])[]>;
}): WorkoutSummary {
  const setsByExercise = groupByExercise(input.sets);
  const exercises: ExerciseSummary[] = [];

  for (const snapshot of input.exercises) {
    const sets = sortSets(setsByExercise.get(snapshot.exerciseId) ?? []);
    if (sets.length === 0) continue;
    const prior = input.priorSessionsByExercise.get(snapshot.exerciseId) ?? [];
    const previous = prior.length > 0 ? prior[prior.length - 1]! : null;
    const best = bestSet(sets);
    exercises.push({
      exerciseId: snapshot.exerciseId,
      name: snapshot.name,
      order: snapshot.order,
      totalSets: sets.length,
      metricSets: metricSets(sets).length,
      volume: volume(sets),
      topWeight: topWeight(sets),
      bestE1rm: bestE1rm(sets),
      bestSet: best,
      prs: detectSessionPRs(sets, prior),
      comparison: compareSessions(sets, previous),
    });
  }

  const durationMs = input.finishedAt.getTime() - input.startedAt.getTime();
  return {
    durationSec: Math.max(0, Math.round(durationMs / 1000)),
    totalVolume: roundTo(
      exercises.reduce((sum, e) => sum + e.volume, 0),
      2,
    ),
    totalSets: input.sets.length,
    metricSets: exercises.reduce((sum, e) => sum + e.metricSets, 0),
    exerciseCount: exercises.length,
    prCount: exercises.reduce((sum, e) => sum + e.prs.length, 0),
    exercises,
  };
}
