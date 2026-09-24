/**
 * History integrity: editing routines or exercises after a workout never changes
 * what that workout shows.
 */
import { buildWorkoutSummary } from '../analytics/summary';
import type { Exercise, Routine, WorkoutSession, WorkoutSet } from './types';
import { addUnique, moveItem, removeAt } from './routineOps';
import { buildExerciseSnapshots } from './workoutOps';
import { buildWorkoutView } from './workoutView';

const exercise = (id: string, name: string): Exercise => ({
  id,
  name,
  notes: null,
  archived: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

function makeSet(
  workout: WorkoutSession,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
): WorkoutSet {
  const snap = workout.exercises.find((e) => e.exerciseId === exerciseId)!;
  return {
    id: `${workout.id}-${exerciseId}-${setNumber}`,
    workoutId: workout.id,
    exerciseId,
    exerciseNameSnapshot: snap.name,
    exerciseOrder: snap.order,
    setNumber,
    weight,
    reps,
    setType: 'working',
    rir: null,
    workoutStartedAt: workout.startedAt,
    createdAt: new Date(workout.startedAt.getTime() + setNumber * 1000),
    updatedAt: new Date(workout.startedAt.getTime() + setNumber * 1000),
  };
}

function startWorkout(id: string, routine: Routine, catalogue: Map<string, Exercise>) {
  const startedAt = new Date(`2026-0${id.length}-01T10:00:00Z`);
  const workout: WorkoutSession = {
    id,
    sourceRoutineId: routine.id,
    routineNameSnapshot: routine.name,
    startedAt,
    finishedAt: null,
    status: 'active',
    // Deep copy semantics are what the app persists to Firestore.
    exercises: structuredClone(buildExerciseSnapshots(routine, catalogue)),
    summary: null,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
  return workout;
}

describe('historical snapshots', () => {
  const catalogue = new Map(
    ['A', 'B', 'C', 'D', 'E', 'F'].map((id) => [id, exercise(id, `Ejercicio ${id}`)]),
  );
  let routine: Routine = {
    id: 'push',
    name: 'Push',
    exerciseIds: ['A', 'B', 'C', 'D', 'E'],
    archived: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };

  const week1 = startWorkout('w1', routine, catalogue);
  const week1Sets = week1.exercises.map((e, i) => makeSet(week1, e.exerciseId, 1, 50 + i, 8));
  week1.status = 'completed';
  week1.finishedAt = new Date(week1.startedAt.getTime() + 3_600_000);
  week1.summary = buildWorkoutSummary({
    startedAt: week1.startedAt,
    finishedAt: week1.finishedAt,
    exercises: week1.exercises,
    sets: week1Sets,
    priorSessionsByExercise: new Map(),
  });
  const before = structuredClone(buildWorkoutView(week1, week1Sets));

  it('shows A, B, C, D, E even after E is replaced by F in the routine (week 4)', () => {
    routine = {
      ...routine,
      exerciseIds: addUnique(removeAt(routine.exerciseIds, 4), 'F'),
    };
    expect(routine.exerciseIds).toEqual(['A', 'B', 'C', 'D', 'F']);
    const view = buildWorkoutView(week1, week1Sets);
    expect(view.map((e) => e.name)).toEqual([
      'Ejercicio A',
      'Ejercicio B',
      'Ejercicio C',
      'Ejercicio D',
      'Ejercicio E',
    ]);
    expect(view).toEqual(before);
  });

  it('keeps old names and order after renaming and reordering', () => {
    catalogue.get('A')!.name = 'Press banca con pausa';
    routine = { ...routine, name: 'Empuje', exerciseIds: moveItem(routine.exerciseIds, 0, 3) };
    const view = buildWorkoutView(week1, week1Sets);
    expect(view[0]!.name).toBe('Ejercicio A');
    expect(view.map((e) => e.exerciseId)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(week1.routineNameSnapshot).toBe('Push');
    expect(view).toEqual(before);
  });

  it('a new workout uses the current routine, while the old one is untouched', () => {
    const week4 = startWorkout('w4-new', routine, catalogue);
    expect(week4.exercises.map((e) => e.name)).toEqual([
      'Ejercicio B',
      'Ejercicio C',
      'Ejercicio D',
      'Press banca con pausa',
      'Ejercicio F',
    ]);
    expect(buildWorkoutView(week1, week1Sets)).toEqual(before);
  });

  it('keeps weights, reps, set types and RIR exactly as logged', () => {
    const view = buildWorkoutView(week1, week1Sets);
    expect(view[2]!.sets[0]).toMatchObject({ weight: 52, reps: 8, setType: 'working', rir: null });
    expect(view[0]!.summary?.volume).toBe(400);
  });

  it('marks planned exercises without sets as empty rather than dropping them', () => {
    const partial = buildWorkoutView(week1, week1Sets.slice(0, 2));
    expect(partial).toHaveLength(5);
    expect(partial[4]!.sets).toEqual([]);
  });
});
