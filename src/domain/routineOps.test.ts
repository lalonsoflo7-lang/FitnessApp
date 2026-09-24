import { addUnique, findExerciseByName, moveItem, removeAt } from './routineOps';
import type { Exercise } from './types';

const ex = (id: string, name: string, archived = false): Exercise => ({
  id,
  name,
  notes: null,
  archived,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

describe('routine exercise ordering', () => {
  it('moves an item up and down', () => {
    expect(moveItem(['A', 'B', 'C', 'D'], 3, 1)).toEqual(['A', 'D', 'B', 'C']);
    expect(moveItem(['A', 'B', 'C'], 0, 2)).toEqual(['B', 'C', 'A']);
  });

  it('ignores out-of-range moves and never mutates the input', () => {
    const list = ['A', 'B'];
    expect(moveItem(list, 0, 5)).toEqual(['A', 'B']);
    expect(moveItem(list, -1, 0)).toEqual(['A', 'B']);
    moveItem(list, 0, 1);
    expect(list).toEqual(['A', 'B']);
  });

  it('adds without duplicates and removes by index', () => {
    expect(addUnique(['A'], 'B')).toEqual(['A', 'B']);
    expect(addUnique(['A', 'B'], 'A')).toEqual(['A', 'B']);
    expect(removeAt(['A', 'B', 'C'], 1)).toEqual(['A', 'C']);
  });
});

describe('findExerciseByName', () => {
  const list = [ex('1', 'Press banca'), ex('2', 'Sentadilla', true), ex('3', 'sentadilla')];

  it('matches ignoring case, spaces and accents', () => {
    expect(findExerciseByName(list, '  press   BANCA ')?.id).toBe('1');
    expect(findExerciseByName([ex('9', 'Elevación lateral')], 'elevacion lateral')?.id).toBe('9');
  });

  it('prefers the non-archived exercise', () => {
    expect(findExerciseByName(list, 'Sentadilla')?.id).toBe('3');
  });

  it('returns undefined for empty or unknown names', () => {
    expect(findExerciseByName(list, '   ')).toBeUndefined();
    expect(findExerciseByName(list, 'Remo')).toBeUndefined();
  });
});
