import { formatClock, formatDuration, formatRepsDelta, formatSigned, formatWeight } from './format';

describe('format helpers', () => {
  it('formats weights in kg with up to 2 decimals', () => {
    expect(formatWeight(80)).toBe('80 kg');
    expect(formatWeight(82.5)).toBe('82.5 kg');
    expect(formatWeight(null)).toBe('—');
    expect(formatWeight(Number.NaN)).toBe('—');
  });

  it('formats signed deltas', () => {
    expect(formatSigned(2.5, ' kg')).toBe('+2.5 kg');
    expect(formatSigned(-5, ' kg')).toBe('−5 kg');
    expect(formatRepsDelta(1)).toBe('+1 rep');
    expect(formatRepsDelta(-2)).toBe('−2 reps');
  });

  it('formats durations', () => {
    expect(formatDuration(540)).toBe('9 min');
    expect(formatDuration(3725)).toBe('1 h 02 min');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });
});
