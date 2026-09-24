import type { PersonalRecord, SetLike } from '../domain/types';
import { bestE1rm, maxRepsByWeight, recordSets, topWeight, volume } from './metrics';

function maxOf(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length === 0 ? null : Math.max(...nums);
}

/**
 * Records a session of one exercise sets against previous *completed* sessions.
 * `priorSessions` must not contain the current session (so it is never compared with itself).
 * The first session ever for an exercise produces no records: there is nothing to beat yet.
 */
export function detectSessionPRs(
  current: readonly SetLike[],
  priorSessions: readonly (readonly SetLike[])[],
): PersonalRecord[] {
  const prior = priorSessions.filter((s) => recordSets(s).length > 0);
  if (prior.length === 0 || recordSets(current).length === 0) return [];
  const prs: PersonalRecord[] = [];

  const curTop = topWeight(current);
  const prevTop = maxOf(prior.map((s) => topWeight(s)));
  if (curTop !== null && prevTop !== null && curTop > prevTop) {
    prs.push({ kind: 'weight', value: curTop, previous: prevTop });
  }

  const curE1rm = bestE1rm(current);
  const prevE1rm = maxOf(prior.map((s) => bestE1rm(s)));
  if (curE1rm !== null && prevE1rm !== null && curE1rm > prevE1rm) {
    prs.push({ kind: 'e1rm', value: curE1rm, previous: prevE1rm });
  }

  const curVolume = volume(current);
  const prevVolume = maxOf(prior.map((s) => volume(s)));
  if (prevVolume !== null && prevVolume > 0 && curVolume > prevVolume) {
    prs.push({ kind: 'volume', value: curVolume, previous: prevVolume });
  }

  prs.push(...repRecords(current, prior.flat()));
  return prs;
}

/**
 * Rep records: more reps than ever before at exactly the same weight. A weight never lifted
 * before is not a rep record (a heavier one is already reported as a weight record).
 */
function repRecords(current: readonly SetLike[], prior: readonly SetLike[]): PersonalRecord[] {
  const priorMap = maxRepsByWeight(prior);
  const out: PersonalRecord[] = [];
  for (const [weight, reps] of maxRepsByWeight(current)) {
    const previous = priorMap.get(weight);
    if (previous !== undefined && reps > previous) {
      out.push({ kind: 'reps', value: reps, previous, weight });
    }
  }
  return out.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
}

/**
 * Live records for a single set while training. `before` = every earlier set that can be
 * compared against: previous completed sessions plus earlier sets of today's session.
 */
export function detectSetPRs(set: SetLike, before: readonly SetLike[]): PersonalRecord[] {
  if (recordSets([set]).length === 0 || set.reps < 1) return [];
  if (recordSets(before).length === 0) return [];
  const prs: PersonalRecord[] = [];

  const prevTop = topWeight(before);
  if (prevTop !== null && set.weight > prevTop) {
    prs.push({ kind: 'weight', value: set.weight, previous: prevTop });
  }
  const e1rm = bestE1rm([set]);
  const prevE1rm = bestE1rm(before);
  if (e1rm !== null && prevE1rm !== null && e1rm > prevE1rm) {
    prs.push({ kind: 'e1rm', value: e1rm, previous: prevE1rm });
  }
  prs.push(...repRecords([set], before));
  return prs;
}
