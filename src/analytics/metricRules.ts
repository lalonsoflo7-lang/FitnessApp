import type { SetType } from '../domain/types';

/**
 * Central place for the metric rules. Change these to change every calculation in the app.
 *
 * - Warm-up sets are excluded from volume, records and comparisons.
 * - Working sets and drop sets count.
 */
export const METRIC_SET_TYPES: ReadonlySet<SetType> = new Set<SetType>(['working', 'dropset']);

/** Sets eligible for weight / e1RM records. Drop sets are included (they are real work). */
export const RECORD_SET_TYPES: ReadonlySet<SetType> = METRIC_SET_TYPES;

/**
 * Epley is used for the estimated 1RM. Its accuracy drops quickly with high reps, so sets with
 * more than this many reps get no e1RM (they still count for volume and rep records).
 */
export const E1RM_MAX_REPS = 12;

export function countsForMetrics(setType: SetType): boolean {
  return METRIC_SET_TYPES.has(setType);
}

export function countsForRecords(setType: SetType): boolean {
  return RECORD_SET_TYPES.has(setType);
}
