import type { BestSet, PersonalRecord, SetLike } from '../domain/types';
import type { ExerciseSession } from './history';
import { bestE1rm, bestSet, maxRepsByWeight, metricSets, topWeight, volume } from './metrics';
import { detectSessionPRs } from './prs';

export interface ProgressPoint {
  workoutId: string;
  date: Date;
  routineName: string;
  topWeight: number | null;
  bestE1rm: number | null;
  volume: number;
  /** Reps across effective sets (warm-ups excluded). */
  totalReps: number;
  metricSets: number;
  bestSet: BestSet | null;
  /** Records set in this session, measured against every earlier session. */
  prs: PersonalRecord[];
}

export interface ExerciseProgress {
  points: ProgressPoint[];
  sessionCount: number;
  last: ProgressPoint | null;
  maxWeight: number | null;
  bestE1rm: number | null;
  /** Best set across all sessions (same definition as metrics.bestSet: highest e1RM). */
  bestSet: BestSet | null;
  maxVolume: number | null;
  /** Current rep record at each weight, heaviest first. */
  repRecords: { weight: number; reps: number }[];
}

/** Builds the progression of one exercise from its completed sessions (any order). */
export function buildExerciseProgress(sessions: readonly ExerciseSession[]): ExerciseProgress {
  const ordered = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const points: ProgressPoint[] = [];
  const previous: SetLike[][] = [];

  for (const session of ordered) {
    if (metricSets(session.sets).length === 0) {
      // Warm-up only sessions carry no progression information.
      previous.push(session.sets);
      continue;
    }
    points.push({
      workoutId: session.workoutId,
      date: session.date,
      routineName: session.routineName,
      topWeight: topWeight(session.sets),
      bestE1rm: bestE1rm(session.sets),
      volume: volume(session.sets),
      totalReps: metricSets(session.sets).reduce((n, s) => n + s.reps, 0),
      metricSets: metricSets(session.sets).length,
      bestSet: bestSet(session.sets),
      prs: detectSessionPRs(session.sets, previous),
    });
    previous.push(session.sets);
  }

  const allSets = ordered.flatMap((s) => s.sets);
  const nums = (values: (number | null)[]) => values.filter((v): v is number => v !== null);
  const weights = nums(points.map((p) => p.topWeight));
  const e1rms = nums(points.map((p) => p.bestE1rm));
  return {
    points,
    sessionCount: points.length,
    last: points[points.length - 1] ?? null,
    maxWeight: weights.length ? Math.max(...weights) : null,
    bestE1rm: e1rms.length ? Math.max(...e1rms) : null,
    bestSet: bestSet(allSets),
    maxVolume: points.length ? Math.max(...points.map((p) => p.volume)) : null,
    repRecords: [...maxRepsByWeight(allSets)]
      .map(([weight, reps]) => ({ weight, reps }))
      .sort((a, b) => b.weight - a.weight),
  };
}
