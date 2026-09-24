import type { SetLike, SetType } from '../domain/types';
import {
  bestE1rm,
  bestSet,
  estimateOneRepMax,
  maxRepsByWeight,
  metricSets,
  topWeight,
  volume,
} from './metrics';

const s = (weight: number, reps: number, setType: SetType = 'working'): SetLike => ({
  weight,
  reps,
  setType,
});

describe('volume', () => {
  it('is the sum of weight × reps', () => {
    expect(volume([s(80, 8), s(80, 7), s(75, 9)])).toBe(640 + 560 + 675);
  });

  it('excludes warm-ups and includes drop sets', () => {
    expect(volume([s(40, 10, 'warmup'), s(80, 8), s(60, 10, 'dropset')])).toBe(640 + 600);
    expect(metricSets([s(40, 10, 'warmup')])).toHaveLength(0);
  });

  it('handles decimals without floating point noise', () => {
    expect(volume([s(22.5, 3), s(0.1, 3)])).toBe(67.8);
  });

  it('is 0 for empty sessions and ignores NaN/Infinity/negative data', () => {
    expect(volume([])).toBe(0);
    expect(volume([s(Number.NaN, 5), s(Number.POSITIVE_INFINITY, 1), s(-10, 5), s(50, 2)])).toBe(
      100,
    );
  });
});

describe('estimateOneRepMax (Epley)', () => {
  it('applies weight × (1 + reps/30)', () => {
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 2);
    expect(estimateOneRepMax(80, 8)).toBeCloseTo(101.33, 2);
  });

  it('returns the weight itself for a single rep', () => {
    expect(estimateOneRepMax(120, 1)).toBe(120);
  });

  it('is not estimated for 0 reps, 0 kg, too many reps or invalid numbers', () => {
    expect(estimateOneRepMax(100, 0)).toBeNull();
    expect(estimateOneRepMax(0, 10)).toBeNull();
    expect(estimateOneRepMax(60, 13)).toBeNull();
    expect(estimateOneRepMax(Number.NaN, 5)).toBeNull();
    expect(estimateOneRepMax(100, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('topWeight / bestE1rm / bestSet', () => {
  const sets = [s(100, 5, 'warmup'), s(80, 8), s(85, 4), s(60, 12, 'dropset')];

  it('ignores warm-ups for the heaviest weight', () => {
    expect(topWeight(sets)).toBe(85);
    expect(topWeight([s(100, 3, 'warmup')])).toBeNull();
  });

  it('ignores sets with 0 reps for the heaviest weight', () => {
    expect(topWeight([s(80, 8), s(120, 0)])).toBe(80);
  });

  it('picks the best set by e1RM, not by weight', () => {
    // 80×8 → 101.3 beats 85×4 → 96.3
    expect(bestSet(sets)).toEqual({ weight: 80, reps: 8, e1rm: expect.closeTo(101.33, 2) });
    expect(bestE1rm(sets)).toBeCloseTo(101.33, 2);
  });

  it('breaks e1RM ties by heavier weight', () => {
    // 90×1 = 90, 87.1…: craft an exact tie: 75×12 = 105 and 105×1 = 105
    expect(bestSet([s(75, 12), s(105, 1)])).toMatchObject({ weight: 105, reps: 1 });
  });

  it('falls back to heaviest weight when no e1RM is possible', () => {
    expect(bestSet([s(0, 15), s(10, 20), s(10, 25)])).toEqual({ weight: 10, reps: 25, e1rm: null });
  });

  it('returns null without eligible sets', () => {
    expect(bestSet([])).toBeNull();
    expect(bestSet([s(60, 10, 'warmup')])).toBeNull();
  });
});

describe('maxRepsByWeight', () => {
  it('keeps the best reps for each weight, excluding warm-ups', () => {
    const map = maxRepsByWeight([s(80, 8), s(80, 9), s(80, 12, 'warmup'), s(75, 10)]);
    expect(map.get(80)).toBe(9);
    expect(map.get(75)).toBe(10);
  });
});
