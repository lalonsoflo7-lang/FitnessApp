import { collection, doc, type Firestore } from 'firebase/firestore';

/**
 * Every document lives under users/{uid}/… so security rules can isolate users by path.
 * Document ids are generated client-side (Firestore auto-ids), which is safe offline.
 */
export const COLLECTIONS = {
  exercises: 'exercises',
  routines: 'routines',
  workouts: 'workouts',
  sets: 'sets',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export function userCollection(db: Firestore, uid: string, name: CollectionName) {
  return collection(db, 'users', uid, name);
}

export function userDoc(db: Firestore, uid: string, name: CollectionName, id: string) {
  return doc(db, 'users', uid, name, id);
}

export function newDocRef(db: Firestore, uid: string, name: CollectionName) {
  return doc(userCollection(db, uid, name));
}
