import { finiteOrNull, isValidRir, parseReps, parseWeight, validateName } from './validation';

describe('parseWeight', () => {
  it('accepts integers, decimals and comma decimals', () => {
    expect(parseWeight('80')).toEqual({ ok: true, value: 80 });
    expect(parseWeight('82.5')).toEqual({ ok: true, value: 82.5 });
    expect(parseWeight('82,5')).toEqual({ ok: true, value: 82.5 });
    expect(parseWeight('0')).toEqual({ ok: true, value: 0 });
  });

  it('rejects negatives, text, empty, NaN and Infinity', () => {
    for (const bad of ['-5', 'abc', '', 'NaN', 'Infinity', '1e3', '5..5']) {
      expect(parseWeight(bad).ok).toBe(false);
    }
    expect(parseWeight(Number.NaN).ok).toBe(false);
    expect(parseWeight(Number.POSITIVE_INFINITY).ok).toBe(false);
  });

  it('rejects absurd values', () => {
    expect(parseWeight('5000').ok).toBe(false);
  });
});

describe('parseReps', () => {
  it('accepts non-negative integers', () => {
    expect(parseReps('8')).toEqual({ ok: true, value: 8 });
    expect(parseReps('0')).toEqual({ ok: true, value: 0 });
  });

  it('rejects decimals, negatives and text', () => {
    for (const bad of ['7.5', '-1', 'x', '']) expect(parseReps(bad).ok).toBe(false);
  });
});

describe('isValidRir', () => {
  it('accepts null and integers 0–5', () => {
    expect(isValidRir(null)).toBe(true);
    expect(isValidRir(0)).toBe(true);
    expect(isValidRir(5)).toBe(true);
  });

  it('rejects anything else', () => {
    for (const bad of [6, -1, 1.5, '2', undefined, Number.NaN]) expect(isValidRir(bad)).toBe(false);
  });
});

describe('validateName', () => {
  it('trims and collapses spaces', () => {
    expect(validateName('  Press   banca ')).toEqual({ ok: true, value: 'Press banca' });
  });

  it('rejects empty and too long names', () => {
    expect(validateName('   ').ok).toBe(false);
    expect(validateName('x'.repeat(81)).ok).toBe(false);
  });
});

describe('finiteOrNull', () => {
  it('filters out non-finite values', () => {
    expect(finiteOrNull(3)).toBe(3);
    expect(finiteOrNull(Number.NaN)).toBeNull();
    expect(finiteOrNull(Number.POSITIVE_INFINITY)).toBeNull();
    expect(finiteOrNull('3')).toBeNull();
  });
});
