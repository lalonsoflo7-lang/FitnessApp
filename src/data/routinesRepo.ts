import { Timestamp, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebase } from '../firebase/firebase';
import { COLLECTIONS, newDocRef, userDoc } from './paths';
import { trackWrite } from './writeTracker';

export function createRoutine(uid: string, name: string, exerciseIds: string[]): string {
  const { db } = getFirebase();
  const ref = newDocRef(db, uid, COLLECTIONS.routines);
  const now = Timestamp.now();
  trackWrite(setDoc(ref, { name, exerciseIds, archived: false, createdAt: now, updatedAt: now }));
  return ref.id;
}

/**
 * Updates only the routine document. Past workouts hold their own snapshot of names and
 * order, so nothing here can alter history.
 */
export function updateRoutine(
  uid: string,
  id: string,
  patch: { name?: string; exerciseIds?: string[]; archived?: boolean },
): void {
  const { db } = getFirebase();
  trackWrite(
    updateDoc(userDoc(db, uid, COLLECTIONS.routines, id), {
      ...patch,
      updatedAt: Timestamp.now(),
    }),
  );
}

/** Permanently deletes a routine. Workouts started from it keep their snapshot. */
export function deleteRoutine(uid: string, id: string): void {
  const { db } = getFirebase();
  trackWrite(deleteDoc(userDoc(db, uid, COLLECTIONS.routines, id)));
}
