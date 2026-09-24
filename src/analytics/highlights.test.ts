import type { ExerciseSummary, WorkoutSession } from '../domain/types';
import { buildRecentHighlights } from './highlights';

const ex = (
  exerciseId: string,
  name: string,
  overrides: Partial<ExerciseSummary> = {},
): ExerciseSummary => ({
  exerciseId,
  name,
  order: 0,
  totalSets: 3,
  metricSets: 3,
  volume: 1000,
  topWeight: 80,
  bestE1rm: 100,
  bestSet: null,
  prs: [],
  comparison: null,
  ...overrides,
});

const cmp = (topWeightDelta: number, repsDelta: number, sameStructure = true) => ({
  volumeDelta: 0,
  topWeightDelta,
  e1rmDelta: 0,
  repsDelta,
  currentMetricSets: 3,
  previousMetricSets: sameStructure ? 3 : 2,
  sameStructure,
});

const workout = (
  id: string,
  exercises: ExerciseSummary[],
  status: WorkoutSession['status'] = 'completed',
): WorkoutSession => ({
  id,
  sourceRoutineId: null,
  routineNameSnapshot: 'Push',
  startedAt: new Date(0),
  finishedAt: new Date(0),
  status,
  exercises: [],
  summary: {
    durationSec: 0,
    totalVolume: 0,
    totalSets: 0,
    metricSets: 0,
    exerciseCount: exercises.length,
    prCount: 0,
    exercises,
  },
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

describe('buildRecentHighlights', () => {
  it('reports PRs, weight increases and rep increases', () => {
    const h = buildRecentHighlights([
      workout('w2', [
        ex('squat', 'Sentadilla', { prs: [{ kind: 'weight', value: 120, previous: 115 }] }),
        ex('bench', 'Press banca', { comparison: cmp(5, 0) }),
        ex('curl', 'Curl', { comparison: cmp(0, 2) }),
        ex('row', 'Remo', { comparison: cmp(-2.5, 4) }),
      ]),
    ]);
    expect(h.map((x) => `${x.name} · ${x.text}`)).toEqual([
      'Sentadilla · nuevo PR',
      'Press banca · +5 kg',
      'Curl · +2 reps',
    ]);
  });

  it('only uses the most recent session of each exercise and ignores active workouts', () => {
    const h = buildRecentHighlights([
      workout('live', [ex('bench', 'Press banca', { comparison: cmp(10, 0) })], 'active'),
      workout('w3', [ex('bench', 'Press banca', { comparison: cmp(-5, 0) })]),
      workout('w2', [ex('bench', 'Press banca', { comparison: cmp(5, 0) })]),
    ]);
    expect(h).toEqual([]);
  });

  it('does not claim rep gains when the structure changed', () => {
    const h = buildRecentHighlights([
      workout('w', [ex('curl', 'Curl', { comparison: cmp(0, 6, false) })]),
    ]);
    expect(h).toEqual([]);
  });
});
