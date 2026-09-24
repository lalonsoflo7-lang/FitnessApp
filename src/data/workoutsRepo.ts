import { Timestamp, deleteDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getFirebase } from '../firebase/firebase';
import type {
  ExerciseSnapshot,
  Routine,
  SetType,
  WorkoutSession,
  WorkoutSummary,
} from '../domain/types';
import { COLLECTIONS, newDocRef, userDoc } from './paths';
import { trackWrite } from './writeTracker';

export function startWorkout(
  uid: string,
  routine: Pick<Routine, 'id' | 'name'>,
  exercises: ExerciseSnapshot[],
): string {
  const { db } = getFirebase();
  const ref = newDocRef(db, uid, COLLECTIONS.workouts);
  const now = Timestamp.now();
  trackWrite(
    setDoc(ref, {
      sourceRoutineId: routine.id,
      routineNameSnapshot: routine.name,
      startedAt: now,
      finishedAt: null,
      status: 'active',
      exercises,
      summary: null,
      createdAt: now,
      updatedAt: now,
    }),
  );
  return ref.id;
}

export function finishWorkout(
  uid: string,
  workoutId: string,
  summary: WorkoutSummary,
  finishedAt: Date,
): void {
  const { db } = getFirebase();
  trackWrite(
    updateDoc(userDoc(db, uid, COLLECTIONS.workouts, workoutId), {
      status: 'completed',
      finishedAt: Timestamp.fromDate(finishedAt),
      summary,
      updatedAt: Timestamp.now(),
    }),
  );
}

/** Deletes an active workout and all of its sets atomically. */
export function discardWorkout(uid: string, workoutId: string, setIds: readonly string[]): void {
  const { db } = getFirebase();
  const batch = writeBatch(db);
  for (const id of setIds) batch.delete(userDoc(db, uid, COLLECTIONS.sets, id));
  batch.delete(userDoc(db, uid, COLLECTIONS.workouts, workoutId));
  trackWrite(batch.commit());
}

export interface SetValues {
  weight: number;
  reps: number;
  setType: SetType;
  rir: number | null;
}

export function addSet(
  uid: string,
  workout: Pick<WorkoutSession, 'id' | 'startedAt'>,
  exercise: ExerciseSnapshot,
  setNumber: number,
  values: SetValues,
): string {
  const { db } = getFirebase();
  const ref = newDocRef(db, uid, COLLECTIONS.sets);
  const now = Timestamp.now();
  trackWrite(
    setDoc(ref, {
      workoutId: workout.id,
      exerciseId: exercise.exerciseId,
      exerciseNameSnapshot: exercise.name,
      exerciseOrder: exercise.order,
      setNumber,
      weight: values.weight,
      reps: values.reps,
      setType: values.setType,
      rir: values.rir,
      workoutStartedAt: Timestamp.fromDate(workout.startedAt),
      createdAt: now,
      updatedAt: now,
    }),
  );
  return ref.id;
}

export function updateSet(uid: string, setId: string, values: SetValues): void {
  const { db } = getFirebase();
  trackWrite(
    updateDoc(userDoc(db, uid, COLLECTIONS.sets, setId), {
      ...values,
      updatedAt: Timestamp.now(),
    }),
  );
}

export function deleteSet(
  uid: string,
  setId: string,
  renumber: readonly { id: string; setNumber: number }[],
): void {
  const { db } = getFirebase();
  if (renumber.length === 0) {
    trackWrite(deleteDoc(userDoc(db, uid, COLLECTIONS.sets, setId)));
    return;
  }
  const batch = writeBatch(db);
  const now = Timestamp.now();
  batch.delete(userDoc(db, uid, COLLECTIONS.sets, setId));
  for (const { id, setNumber } of renumber) {
    batch.update(userDoc(db, uid, COLLECTIONS.sets, id), { setNumber, updatedAt: now });
  }
  trackWrite(batch.commit());
}
