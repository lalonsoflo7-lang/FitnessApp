import type { SetLike, SetType } from '../domain/types';
import { compareSessions, compareSetWithPrevious } from './compare';

const s = (weight: number, reps: number, setType: SetType = 'working'): SetLike => ({
  weight,
  reps,
  setType,
});

describe('compareSessions', () => {
  const previous = [s(40, 10, 'warmup'), s(80, 8), s(80, 7), s(75, 9)];

  it('returns null without a previous session', () => {
    expect(compareSessions([s(80, 8)], null)).toBeNull();
    expect(compareSessions([s(80, 8)], [s(40, 10, 'warmup')])).toBeNull();
  });

  it('computes volume, top weight and e1RM deltas', () => {
    const current = [s(40, 10, 'warmup'), s(82.5, 8), s(80, 8), s(75, 9)];
    const c = compareSessions(current, previous)!;
    expect(c.volumeDelta).toBe(660 + 640 + 675 - (640 + 560 + 675));
    expect(c.topWeightDelta).toBe(2.5);
    expect(c.e1rmDelta).toBeCloseTo(82.5 * (1 + 8 / 30) - 80 * (1 + 8 / 30), 2);
    expect(c.sameStructure).toBe(true);
  });

  it('flags different structures so volume deltas are not over-interpreted', () => {
    const c = compareSessions([s(80, 8), s(80, 8)], previous)!;
    expect(c.sameStructure).toBe(false);
    expect(c.currentMetricSets).toBe(2);
    expect(c.previousMetricSets).toBe(3);
  });
});

describe('compareSetWithPrevious', () => {
  const previous = [s(40, 10, 'warmup'), s(80, 8), s(80, 7)];

  it('pairs the n-th effective set, skipping warm-ups on both sides', () => {
    const today = [s(40, 10, 'warmup'), s(50, 5, 'warmup'), s(80, 9), s(82.5, 7)];
    expect(compareSetWithPrevious(today, 2, previous)).toEqual({ weightDelta: 0, repsDelta: 1 });
    expect(compareSetWithPrevious(today, 3, previous)).toEqual({
      weightDelta: 2.5,
      repsDelta: 0,
    });
  });

  it('returns null for warm-ups and sets without a counterpart', () => {
    const today = [s(40, 10, 'warmup'), s(80, 8), s(80, 8), s(80, 8)];
    expect(compareSetWithPrevious(today, 0, previous)).toBeNull();
    expect(compareSetWithPrevious(today, 3, previous)).toBeNull();
    expect(compareSetWithPrevious(today, 1, null)).toBeNull();
  });
});
