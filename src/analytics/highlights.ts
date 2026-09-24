import type { WorkoutSession } from '../domain/types';
import { DEFAULT_WEIGHT_UNIT } from '../config/constants';
import { formatRepsDelta, formatSigned } from '../lib/format';

export interface Highlight {
  exerciseId: string;
  name: string;
  text: string;
  kind: 'pr' | 'up';
  workoutId: string;
  date: Date;
}

/**
 * Short progress notes for the home screen ("Press banca · +5 kg", "Sentadilla · nuevo PR").
 * Uses the summaries stored on completed workouts, so it needs no extra reads.
 * One note per exercise (its most recent session); only improvements are shown.
 */
export function buildRecentHighlights(
  workoutsNewestFirst: readonly WorkoutSession[],
  limit = 5,
  lookback = 6,
): Highlight[] {
  const seen = new Set<string>();
  const out: Highlight[] = [];
  const recent = workoutsNewestFirst.filter((w) => w.status === 'completed').slice(0, lookback);
  for (const workout of recent) {
    for (const ex of workout.summary?.exercises ?? []) {
      if (seen.has(ex.exerciseId)) continue;
      seen.add(ex.exerciseId);
      const base = {
        exerciseId: ex.exerciseId,
        name: ex.name,
        workoutId: workout.id,
        date: workout.startedAt,
      };
      const c = ex.comparison;
      if (ex.prs.length > 0) {
        out.push({ ...base, kind: 'pr', text: 'nuevo PR' });
      } else if (c && c.topWeightDelta !== null && c.topWeightDelta > 0) {
        out.push({
          ...base,
          kind: 'up',
          text: formatSigned(c.topWeightDelta, ` ${DEFAULT_WEIGHT_UNIT}`),
        });
      } else if (c && c.topWeightDelta === 0 && c.sameStructure && (c.repsDelta ?? 0) > 0) {
        out.push({ ...base, kind: 'up', text: formatRepsDelta(c.repsDelta!) });
      }
      if (out.length >= limit) return out;
    }
  }
  return out;
}
