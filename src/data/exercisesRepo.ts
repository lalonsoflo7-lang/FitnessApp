import { Timestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebase } from '../firebase/firebase';
import { normalizeName } from '../domain/validation';
import { COLLECTIONS, newDocRef, userDoc } from './paths';
import { trackWrite } from './writeTracker';

/** Creates an exercise and returns its id immediately (works offline). */
export function createExercise(uid: string, name: string): string {
  const { db } = getFirebase();
  const ref = newDocRef(db, uid, COLLECTIONS.exercises);
  const now = Timestamp.now();
  trackWrite(
    setDoc(ref, {
      name,
      nameKey: normalizeName(name),
      notes: null,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }),
  );
  return ref.id;
}

export function updateExercise(
  uid: string,
  id: string,
  patch: { name?: string; notes?: string | null; archived?: boolean },
): void {
  const { db } = getFirebase();
  const data: Record<string, unknown> = { ...patch, updatedAt: Timestamp.now() };
  if (patch.name !== undefined) data.nameKey = normalizeName(patch.name);
  trackWrite(updateDoc(userDoc(db, uid, COLLECTIONS.exercises, id), data));
}
