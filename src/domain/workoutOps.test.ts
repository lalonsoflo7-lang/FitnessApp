import type { Exercise, WorkoutSet } from './types';
import {
  EMPTY_DRAFT,
  buildExerciseSnapshots,
  nextSetNumber,
  renumberAfterDelete,
  suggestNextSet,
} from './workoutOps';

const ex = (id: string, name: string): Exercise => ({
  id,
  name,
  notes: null,
  archived: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

describe('buildExerciseSnapshots', () => {
  const byId = new Map(['A', 'B', 'C'].map((id) => [id, ex(id, `Ejercicio ${id}`)]));

  it('keeps routine order and copies names', () => {
    expect(buildExerciseSnapshots({ exerciseIds: ['C', 'A', 'B'] }, byId)).toEqual([
      { exerciseId: 'C', name: 'Ejercicio C', order: 0 },
      { exerciseId: 'A', name: 'Ejercicio A', order: 1 },
      { exerciseId: 'B', name: 'Ejercicio B', order: 2 },
    ]);
  });

  it('skips unknown and duplicated ids', () => {
    expect(
      buildExerciseSnapshots({ exerciseIds: ['A', 'X', 'A', 'B'] }, byId).map((s) => s.exerciseId),
    ).toEqual(['A', 'B']);
  });

  it('is a copy: renaming the exercise afterwards does not change the snapshot', () => {
    const mutable = new Map([['A', ex('A', 'Press banca')]]);
    const snapshot = buildExerciseSnapshots({ exerciseIds: ['A'] }, mutable);
    mutable.get('A')!.name = 'Press banca inclinado';
    expect(snapshot[0]!.name).toBe('Press banca');
  });
});

describe('set numbering', () => {
  it('computes the next set number', () => {
    expect(nextSetNumber([])).toBe(1);
    expect(nextSetNumber([{ setNumber: 1 }, { setNumber: 3 }])).toBe(4);
  });

  it('renumbers only the sets after the deleted one', () => {
    const sets = [
      { id: 'a', setNumber: 1 },
      { id: 'b', setNumber: 2 },
      { id: 'c', setNumber: 3 },
      { id: 'd', setNumber: 4 },
    ];
    expect(renumberAfterDelete(sets, 'b')).toEqual([
      { id: 'c', setNumber: 2 },
      { id: 'd', setNumber: 3 },
    ]);
    expect(renumberAfterDelete(sets, 'd')).toEqual([]);
  });
});

describe('suggestNextSet', () => {
  const set = (weight: number, reps: number, setType: WorkoutSet['setType'] = 'working') => ({
    weight,
    reps,
    setType,
  });

  it('repeats the last set of today', () => {
    expect(suggestNextSet([set(40, 10, 'warmup'), set(80, 8)], [set(75, 10)])).toEqual({
      weight: '80',
      reps: '8',
      setType: 'working',
      rir: null,
    });
  });

  it('uses the previous session for the first set', () => {
    expect(suggestNextSet([], [set(40, 10, 'warmup'), set(80, 8)])).toEqual({
      weight: '40',
      reps: '10',
      setType: 'warmup',
      rir: null,
    });
  });

  it('is empty without history', () => {
    expect(suggestNextSet([], null)).toEqual(EMPTY_DRAFT);
  });
});
