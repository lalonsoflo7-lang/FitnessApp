import type { SessionComparison, SetLike } from '../domain/types';
import { roundTo } from '../domain/validation';
import { bestE1rm, metricSets, topWeight, volume } from './metrics';

function delta(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : roundTo(a - b, 2);
}

/** Compares one exercise's session against its previous session. */
export function compareSessions(
  current: readonly SetLike[],
  previous: readonly SetLike[] | null,
): SessionComparison | null {
  if (!previous) return null;
  const currentMetricSets = metricSets(current).length;
  const previousMetricSets = metricSets(previous).length;
  if (previousMetricSets === 0) return null;
  return {
    volumeDelta: roundTo(volume(current) - volume(previous), 2),
    topWeightDelta: delta(topWeight(current), topWeight(previous)),
    e1rmDelta: delta(bestE1rm(current), bestE1rm(previous)),
    currentMetricSets,
    previousMetricSets,
    sameStructure: currentMetricSets === previousMetricSets,
  };
}

export interface SetDelta {
  weightDelta: number;
  repsDelta: number;
}

/**
 * Compares today's n-th effective set with the n-th effective set of the previous session.
 * Warm-ups are not compared. Returns null when there is no counterpart.
 */
export function compareSetWithPrevious(
  todaySets: readonly SetLike[],
  index: number,
  previousSets: readonly SetLike[] | null,
): SetDelta | null {
  const set = todaySets[index];
  if (!set || !previousSets) return null;
  const todayMetric = metricSets(todaySets.slice(0, index + 1));
  if (!todayMetric.includes(set)) return null;
  const counterpart = metricSets(previousSets)[todayMetric.length - 1];
  if (!counterpart) return null;
  return {
    weightDelta: roundTo(set.weight - counterpart.weight, 2),
    repsDelta: set.reps - counterpart.reps,
  };
}
