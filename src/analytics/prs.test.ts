import type { SetLike, SetType } from '../domain/types';
import { detectSessionPRs, detectSetPRs } from './prs';

const s = (weight: number, reps: number, setType: SetType = 'working'): SetLike => ({
  weight,
  reps,
  setType,
});

const week1 = [s(40, 10, 'warmup'), s(80, 8), s(80, 7), s(75, 9)];

describe('detectSessionPRs', () => {
  it('reports nothing for the first session ever', () => {
    expect(detectSessionPRs(week1, [])).toEqual([]);
  });

  it('never compares a session with itself (identical repeat is not a PR)', () => {
    expect(detectSessionPRs(week1, [week1])).toEqual([]);
  });

  it('detects a weight PR', () => {
    const prs = detectSessionPRs([s(82.5, 5)], [week1]);
    expect(prs).toContainEqual({ kind: 'weight', value: 82.5, previous: 80 });
  });

  it('ignores warm-ups for weight PRs', () => {
    const prs = detectSessionPRs([s(100, 3, 'warmup'), s(70, 5)], [week1]);
    expect(prs.find((p) => p.kind === 'weight')).toBeUndefined();
  });

  it('detects a rep PR at a specific weight', () => {
    const prs = detectSessionPRs([s(80, 9), s(80, 7)], [week1]);
    expect(prs).toContainEqual({ kind: 'reps', value: 9, previous: 8, weight: 80 });
  });

  it('does not report rep PRs for weights never lifted before', () => {
    const prs = detectSessionPRs([s(77.5, 12)], [week1]);
    expect(prs.find((p) => p.kind === 'reps')).toBeUndefined();
  });

  it('detects an e1RM PR', () => {
    // prior best 80×8 → 101.33; 85×6 → 102
    const prs = detectSessionPRs([s(85, 6)], [week1]);
    const e1rm = prs.find((p) => p.kind === 'e1rm');
    expect(e1rm?.value).toBeCloseTo(102, 2);
    expect(e1rm?.previous).toBeCloseTo(101.33, 2);
  });

  it('detects a session volume PR against the best previous session', () => {
    const w2 = [s(80, 8), s(80, 8), s(75, 9)]; // 1955
    const w3 = [s(80, 8), s(80, 8), s(75, 10)]; // 2030
    const prs = detectSessionPRs(w3, [week1, w2]);
    expect(prs).toContainEqual({ kind: 'volume', value: 2030, previous: 1955 });
    expect(detectSessionPRs(week1, [w2]).find((p) => p.kind === 'volume')).toBeUndefined();
  });

  it('compares against all earlier sessions, not just the last one', () => {
    const heavy = [s(90, 3)];
    const light = [s(80, 5)];
    expect(detectSessionPRs([s(85, 3)], [heavy, light]).find((p) => p.kind === 'weight')).toBe(
      undefined,
    );
  });
});

describe('detectSetPRs (live)', () => {
  it('flags the first set that beats history, but not an equal set after it', () => {
    const history = week1;
    const first = s(82.5, 6);
    expect(detectSetPRs(first, history).map((p) => p.kind)).toContain('weight');
    // A second 82.5 set is compared with history + the first set: not a new weight record.
    expect(detectSetPRs(s(82.5, 5), [...history, first]).map((p) => p.kind)).not.toContain(
      'weight',
    );
  });

  it('ignores warm-up sets and empty history', () => {
    expect(detectSetPRs(s(200, 1, 'warmup'), week1)).toEqual([]);
    expect(detectSetPRs(s(200, 1), [])).toEqual([]);
  });
});
