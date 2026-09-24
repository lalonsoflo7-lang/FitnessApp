import type { BestSet, SetLike } from '../domain/types';
import { roundTo } from '../domain/validation';
import { E1RM_MAX_REPS, countsForMetrics, countsForRecords } from './metricRules';

function isUsable(set: SetLike): boolean {
  return (
    Number.isFinite(set.weight) && Number.isFinite(set.reps) && set.weight >= 0 && set.reps >= 0
  );
}

export function metricSets<T extends SetLike>(sets: readonly T[]): T[] {
  return sets.filter((s) => countsForMetrics(s.setType) && isUsable(s));
}

export function recordSets<T extends SetLike>(sets: readonly T[]): T[] {
  return sets.filter((s) => countsForRecords(s.setType) && isUsable(s));
}

/** weight × reps for a single set (0 for unusable data). */
export function setVolume(set: SetLike): number {
  return isUsable(set) ? set.weight * set.reps : 0;
}

/** Σ weight × reps over the sets that count for metrics (warm-ups excluded). */
export function volume(sets: readonly SetLike[]): number {
  return roundTo(
    metricSets(sets).reduce((sum, s) => sum + setVolume(s), 0),
    2,
  );
}

/**
 * Estimated one-rep max (Epley): weight × (1 + reps / 30).
 * Returns null when it can't be estimated sensibly: 0 reps, 0 kg, or more than E1RM_MAX_REPS.
 * One rep returns the weight itself.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null;
  if (weight <= 0 || reps < 1 || reps > E1RM_MAX_REPS) return null;
  if (reps === 1) return roundTo(weight, 2);
  return roundTo(weight * (1 + reps / 30), 2);
}

/** Heaviest weight in a set that counts for records, with at least one rep. */
export function topWeight(sets: readonly SetLike[]): number | null {
  const candidates = recordSets(sets).filter((s) => s.reps >= 1);
  if (candidates.length === 0) return null;
  return Math.max(...candidates.map((s) => s.weight));
}

export function bestE1rm(sets: readonly SetLike[]): number | null {
  let best: number | null = null;
  for (const s of recordSets(sets)) {
    const e = estimateOneRepMax(s.weight, s.reps);
    if (e !== null && (best === null || e > best)) best = e;
  }
  return best;
}

/**
 * "Best set" = the set with the highest estimated 1RM (ties → heavier weight).
 * If no set has an e1RM (all above E1RM_MAX_REPS reps, or bodyweight at 0 kg), falls back to
 * the heaviest set, then the one with more reps.
 */
export function bestSet(sets: readonly SetLike[]): BestSet | null {
  const candidates = recordSets(sets).filter((s) => s.reps >= 1);
  if (candidates.length === 0) return null;
  let best: BestSet | null = null;
  for (const s of candidates) {
    const e1rm = estimateOneRepMax(s.weight, s.reps);
    const candidate: BestSet = { weight: s.weight, reps: s.reps, e1rm };
    if (best === null || isBetter(candidate, best)) best = candidate;
  }
  return best;
}

function isBetter(a: BestSet, b: BestSet): boolean {
  if (a.e1rm !== null && b.e1rm === null) return true;
  if (a.e1rm === null && b.e1rm !== null) return false;
  if (a.e1rm !== null && b.e1rm !== null && a.e1rm !== b.e1rm) return a.e1rm > b.e1rm;
  if (a.weight !== b.weight) return a.weight > b.weight;
  return a.reps > b.reps;
}

/** Maximum reps achieved at each exact weight (records-eligible sets only). */
export function maxRepsByWeight(sets: readonly SetLike[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const s of recordSets(sets)) {
    const prev = map.get(s.weight);
    if (prev === undefined || s.reps > prev) map.set(s.weight, s.reps);
  }
  return map;
}
