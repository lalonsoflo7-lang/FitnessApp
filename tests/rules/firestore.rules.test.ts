import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const now = Timestamp.now();

const exercise = () => ({
  name: 'Press banca',
  nameKey: 'press banca',
  notes: null,
  archived: false,
  createdAt: now,
  updatedAt: now,
});

const routine = () => ({
  name: 'Push',
  exerciseIds: ['ex1'],
  archived: false,
  createdAt: now,
  updatedAt: now,
});

const activeWorkout = () => ({
  sourceRoutineId: 'r1',
  routineNameSnapshot: 'Push',
  startedAt: now,
  finishedAt: null,
  status: 'active',
  exercises: [{ exerciseId: 'ex1', name: 'Press banca', order: 0 }],
  summary: null,
  createdAt: now,
  updatedAt: now,
});

const set = (overrides: Record<string, unknown> = {}) => ({
  workoutId: 'w1',
  exerciseId: 'ex1',
  exerciseNameSnapshot: 'Press banca',
  exerciseOrder: 0,
  setNumber: 1,
  weight: 80,
  reps: 8,
  setType: 'working',
  rir: null,
  workoutStartedAt: now,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const alice = () => env.authenticatedContext('alice').firestore() as unknown as Firestore;
const bob = () => env.authenticatedContext('bob').firestore() as unknown as Firestore;
const anon = () => env.unauthenticatedContext().firestore() as unknown as Firestore;

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, path), data);
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-fitnessapp-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('user isolation', () => {
  it('lets a user read and write their own data', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/exercises/ex1'), exercise()));
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/exercises/ex1')));
    await assertSucceeds(getDocs(collection(alice(), 'users/alice/workouts')));
  });

  it("blocks reading or writing another user's data", async () => {
    await seed('users/alice/exercises/ex1', exercise());
    await assertFails(getDoc(doc(bob(), 'users/alice/exercises/ex1')));
    await assertFails(getDocs(collection(bob(), 'users/alice/sets')));
    await assertFails(setDoc(doc(bob(), 'users/alice/exercises/ex2'), exercise()));
    await assertFails(updateDoc(doc(bob(), 'users/alice/exercises/ex1'), { archived: true }));
  });

  it('blocks unauthenticated access', async () => {
    await seed('users/alice/routines/r1', routine());
    await assertFails(getDoc(doc(anon(), 'users/alice/routines/r1')));
    await assertFails(setDoc(doc(anon(), 'users/alice/routines/r2'), routine()));
  });

  it('blocks anything outside users/{uid}', async () => {
    await assertFails(setDoc(doc(alice(), 'public/x'), { a: 1 }));
    await assertFails(setDoc(doc(alice(), 'users/alice'), { a: 1 }));
  });
});

describe('exercises and routines', () => {
  it('rejects invalid shapes', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/exercises/e'), { ...exercise(), name: '' }));
    await assertFails(
      setDoc(doc(alice(), 'users/alice/exercises/e'), { ...exercise(), extra: true }),
    );
    await assertFails(
      setDoc(doc(alice(), 'users/alice/routines/r'), { ...routine(), exerciseIds: 'x' }),
    );
  });

  it('never allows deleting an exercise (archive instead)', async () => {
    await seed('users/alice/exercises/ex1', exercise());
    await assertFails(deleteDoc(doc(alice(), 'users/alice/exercises/ex1')));
    await assertSucceeds(
      updateDoc(doc(alice(), 'users/alice/exercises/ex1'), { archived: true, updatedAt: now }),
    );
  });

  it('allows editing and deleting routines', async () => {
    await seed('users/alice/routines/r1', routine());
    await assertSucceeds(
      updateDoc(doc(alice(), 'users/alice/routines/r1'), { exerciseIds: ['ex2', 'ex1'] }),
    );
    await assertSucceeds(deleteDoc(doc(alice(), 'users/alice/routines/r1')));
  });
});

describe('workouts and sets', () => {
  it('creates an active workout and valid sets', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/workouts/w1'), activeWorkout()));
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/sets/s1'), set()));
    await assertSucceeds(
      setDoc(doc(alice(), 'users/alice/sets/s2'), set({ weight: 82.5, rir: 2 })),
    );
  });

  it('cannot create a workout that is already completed', async () => {
    await assertFails(
      setDoc(doc(alice(), 'users/alice/workouts/w1'), {
        ...activeWorkout(),
        status: 'completed',
        finishedAt: now,
        summary: {},
      }),
    );
  });

  it('validates set values', async () => {
    await seed('users/alice/workouts/w1', activeWorkout());
    const bad = [
      { weight: -1 },
      { reps: -3 },
      { reps: 2.5 },
      { rir: 6 },
      { rir: -1 },
      { rir: 1.5 },
      { setType: 'failure' },
      { setNumber: 0 },
      { weight: 'heavy' },
    ];
    for (const override of bad) {
      await assertFails(setDoc(doc(alice(), 'users/alice/sets/bad'), set(override)));
    }
  });

  it('rejects sets for a workout that does not exist', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/sets/s1'), set({ workoutId: 'nope' })));
  });

  it('freezes a completed workout and its sets', async () => {
    await seed('users/alice/workouts/w1', activeWorkout());
    await seed('users/alice/sets/s1', set());
    await assertSucceeds(
      updateDoc(doc(alice(), 'users/alice/workouts/w1'), {
        status: 'completed',
        finishedAt: now,
        summary: { totalVolume: 640 },
        updatedAt: now,
      }),
    );
    await assertFails(
      updateDoc(doc(alice(), 'users/alice/workouts/w1'), { routineNameSnapshot: 'Otro' }),
    );
    await assertFails(deleteDoc(doc(alice(), 'users/alice/workouts/w1')));
    await assertFails(updateDoc(doc(alice(), 'users/alice/sets/s1'), { reps: 12 }));
    await assertFails(deleteDoc(doc(alice(), 'users/alice/sets/s1')));
    await assertFails(setDoc(doc(alice(), 'users/alice/sets/s2'), set({ setNumber: 2 })));
  });

  it('does not allow changing the exercise snapshot of an active workout', async () => {
    await seed('users/alice/workouts/w1', activeWorkout());
    await assertFails(
      updateDoc(doc(alice(), 'users/alice/workouts/w1'), {
        exercises: [{ exerciseId: 'ex9', name: 'Otro', order: 0 }],
      }),
    );
  });

  it('discards an active workout with its sets in one batch', async () => {
    await seed('users/alice/workouts/w1', activeWorkout());
    await seed('users/alice/sets/s1', set());
    await seed('users/alice/sets/s2', set({ setNumber: 2 }));
    const db = alice();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users/alice/sets/s1'));
    batch.delete(doc(db, 'users/alice/sets/s2'));
    batch.delete(doc(db, 'users/alice/workouts/w1'));
    await assertSucceeds(batch.commit());
  });
});
