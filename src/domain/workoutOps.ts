import type { Exercise, ExerciseSnapshot, Routine, SetType, WorkoutSet } from './types';

/**
 * Freezes the routine's exercises (ids, names and order) at the moment a workout starts.
 * The workout keeps this copy forever, so later routine/exercise edits never rewrite history.
 */
export function buildExerciseSnapshots(
  routine: Pick<Routine, 'exerciseIds'>,
  exercisesById: ReadonlyMap<string, Pick<Exercise, 'id' | 'name'>>,
): ExerciseSnapshot[] {
  const snapshots: ExerciseSnapshot[] = [];
  for (const id of routine.exerciseIds) {
    const exercise = exercisesById.get(id);
    if (!exercise || snapshots.some((s) => s.exerciseId === id)) continue;
    snapshots.push({ exerciseId: id, name: exercise.name, order: snapshots.length });
  }
  return snapshots;
}

export function nextSetNumber(exerciseSets: readonly Pick<WorkoutSet, 'setNumber'>[]): number {
  return exerciseSets.reduce((max, s) => Math.max(max, s.setNumber), 0) + 1;
}

/** After deleting a set, returns the renumbering needed to keep 1..n without gaps. */
export function renumberAfterDelete(
  exerciseSets: readonly Pick<WorkoutSet, 'id' | 'setNumber'>[],
  deletedId: string,
): { id: string; setNumber: number }[] {
  return [...exerciseSets]
    .filter((s) => s.id !== deletedId)
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((s, index) => ({ id: s.id, setNumber: index + 1, previous: s.setNumber }))
    .filter((s) => s.setNumber !== s.previous)
    .map(({ id, setNumber }) => ({ id, setNumber }));
}

export interface SetDraft {
  weight: string;
  reps: string;
  setType: SetType;
  rir: number | null;
}

export const EMPTY_DRAFT: SetDraft = { weight: '', reps: '', setType: 'working', rir: null };

function draftFrom(set: Pick<WorkoutSet, 'weight' | 'reps' | 'setType'>): SetDraft {
  return { weight: String(set.weight), reps: String(set.reps), setType: set.setType, rir: null };
}

/**
 * Suggested values for the next set (never saved until the user confirms):
 * - with sets today → repeat the last set's weight, reps and type;
 * - first set → the first set of the previous session;
 * - no history → empty.
 * RIR is never carried over: it is a per-set judgement.
 */
export function suggestNextSet(
  todaySets: readonly Pick<WorkoutSet, 'weight' | 'reps' | 'setType'>[],
  previousSessionSets: readonly Pick<WorkoutSet, 'weight' | 'reps' | 'setType'>[] | null,
): SetDraft {
  const last = todaySets[todaySets.length - 1];
  if (last) return draftFrom(last);
  const firstPrevious = previousSessionSets?.[0];
  if (firstPrevious) return draftFrom(firstPrevious);
  return EMPTY_DRAFT;
}
