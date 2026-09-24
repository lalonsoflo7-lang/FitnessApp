import type { SetType, WorkoutSession, WorkoutSet } from '../domain/types';
import { buildExerciseProgress } from './exerciseProgress';
import { groupExerciseSessions, type ExerciseSession } from './history';

let n = 0;
function set(
  workoutId: string,
  weight: number,
  reps: number,
  setType: SetType = 'working',
): WorkoutSet {
  n += 1;
  return {
    id: `s${n}`,
    workoutId,
    exerciseId: 'bench',
    exerciseNameSnapshot: 'Press banca',
    exerciseOrder: 0,
    setNumber: n,
    weight,
    reps,
    setType,
    rir: null,
    workoutStartedAt: new Date(0),
    createdAt: new Date(n * 1000),
    updatedAt: new Date(n * 1000),
  };
}

const session = (id: string, day: number, sets: WorkoutSet[]): ExerciseSession => ({
  workoutId: id,
  date: new Date(2026, 0, day),
  routineName: 'Push',
  sets,
});

describe('buildExerciseProgress', () => {
  const sessions = [
    session('w1', 1, [set('w1', 40, 10, 'warmup'), set('w1', 80, 8), set('w1', 80, 7)]),
    session('w2', 8, [set('w2', 80, 9), set('w2', 80, 8)]),
    session('w3', 15, [set('w3', 85, 5), set('w3', 80, 8), set('w3', 60, 12, 'dropset')]),
  ];

  it('produces a chronological series with per-session metrics', () => {
    const p = buildExerciseProgress([...sessions].reverse());
    expect(p.points.map((x) => x.workoutId)).toEqual(['w1', 'w2', 'w3']);
    expect(p.points[0]).toMatchObject({
      topWeight: 80,
      volume: 1200,
      totalReps: 15,
      metricSets: 2,
    });
    expect(p.points[2]!.volume).toBe(425 + 640 + 720);
  });

  it('computes records of each session against earlier sessions only', () => {
    const p = buildExerciseProgress(sessions);
    expect(p.points[0]!.prs).toEqual([]);
    expect(p.points[1]!.prs.map((x) => x.kind).sort()).toEqual(['e1rm', 'reps', 'volume']);
    expect(p.points[2]!.prs.map((x) => x.kind)).toContain('weight');
  });

  it('aggregates all-time stats', () => {
    const p = buildExerciseProgress(sessions);
    expect(p.sessionCount).toBe(3);
    expect(p.last?.workoutId).toBe('w3');
    expect(p.maxWeight).toBe(85);
    expect(p.maxVolume).toBe(1785);
    expect(p.bestSet).toMatchObject({ weight: 80, reps: 9 });
    expect(p.repRecords).toEqual([
      { weight: 85, reps: 5 },
      { weight: 80, reps: 9 },
      { weight: 60, reps: 12 },
    ]);
  });

  it('handles an exercise without history', () => {
    const p = buildExerciseProgress([]);
    expect(p).toMatchObject({ sessionCount: 0, last: null, maxWeight: null, bestSet: null });
  });

  it('skips warm-up-only sessions', () => {
    const p = buildExerciseProgress([session('w0', 1, [set('w0', 20, 10, 'warmup')])]);
    expect(p.sessionCount).toBe(0);
  });
});

describe('groupExerciseSessions', () => {
  const workout = (id: string, day: number, status: WorkoutSession['status']): WorkoutSession => ({
    id,
    sourceRoutineId: 'r',
    routineNameSnapshot: 'Push',
    startedAt: new Date(2026, 0, day),
    finishedAt: null,
    status,
    exercises: [],
    summary: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  });
  const byId = new Map([
    ['a', workout('a', 1, 'completed')],
    ['b', workout('b', 3, 'completed')],
    ['live', workout('live', 5, 'active')],
  ]);
  const sets = [set('b', 80, 8), set('a', 75, 8), set('live', 90, 5), set('ghost', 100, 1)];

  it('keeps only completed workouts, oldest first', () => {
    expect(groupExerciseSessions(sets, byId).map((s) => s.workoutId)).toEqual(['a', 'b']);
  });

  it('excludes the current workout and anything after it', () => {
    expect(
      groupExerciseSessions(sets, byId, {
        excludeWorkoutId: 'b',
        before: new Date(2026, 0, 3),
      }).map((s) => s.workoutId),
    ).toEqual(['a']);
  });
});
