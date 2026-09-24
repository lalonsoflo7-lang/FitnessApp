import { useMemo, type ReactNode } from 'react';
import { orderBy, query } from 'firebase/firestore';
import { getFirebase } from '../firebase/firebase';
import { useQuerySubscription } from '../hooks/useQuerySubscription';
import { exerciseFromDoc, routineFromDoc, workoutFromDoc } from './converters';
import { DataContext, type DataState } from './dataContext';
import { COLLECTIONS, userCollection } from './paths';

export function DataProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const exercises = useQuerySubscription(
    `exercises:${uid}`,
    () => userCollection(getFirebase().db, uid, COLLECTIONS.exercises),
    exerciseFromDoc,
  );
  const routines = useQuerySubscription(
    `routines:${uid}`,
    () => userCollection(getFirebase().db, uid, COLLECTIONS.routines),
    routineFromDoc,
  );
  const workouts = useQuerySubscription(
    `workouts:${uid}`,
    () =>
      query(
        userCollection(getFirebase().db, uid, COLLECTIONS.workouts),
        orderBy('startedAt', 'desc'),
      ),
    workoutFromDoc,
  );

  const value = useMemo<DataState>(
    () => ({ uid, exercises, routines, workouts }),
    [uid, exercises, routines, workouts],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
