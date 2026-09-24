import { useEffect, useMemo, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { getFirebase } from '../firebase/firebase';
import { setFromDoc } from '../data/converters';
import { COLLECTIONS, userCollection } from '../data/paths';
import type { WorkoutSet } from '../domain/types';
import { useQuerySubscription, type QueryState } from './useQuerySubscription';

/** Firestore `in` queries accept at most 30 values. */
const IN_LIMIT = 30;

/** Sets of a single workout. */
export function useWorkoutSets(uid: string, workoutId: string | null): QueryState<WorkoutSet> {
  return useQuerySubscription(
    workoutId ? `sets:workout:${uid}:${workoutId}` : null,
    () =>
      query(
        userCollection(getFirebase().db, uid, COLLECTIONS.sets),
        where('workoutId', '==', workoutId),
      ),
    setFromDoc,
  );
}

/** Every set (all workouts) of the given exercises. Loaded only where needed. */
export function useExerciseSets(
  uid: string,
  exerciseIds: readonly string[],
): QueryState<WorkoutSet> {
  const key = [...exerciseIds].sort().join(',');
  const [state, setState] = useState<{
    key: string;
    chunks: Map<number, WorkoutSet[]>;
    error: string | null;
    fromCache: boolean;
  }>({ key: '', chunks: new Map(), error: null, fromCache: false });

  useEffect(() => {
    if (key === '') return;
    const ids = key.split(',');
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += IN_LIMIT) chunks.push(ids.slice(i, i + IN_LIMIT));
    const { db } = getFirebase();
    const unsubscribers = chunks.map((chunk, index) =>
      onSnapshot(
        query(userCollection(db, uid, COLLECTIONS.sets), where('exerciseId', 'in', chunk)),
        (snap) =>
          setState((prev) => {
            const base = prev.key === key ? prev.chunks : new Map<number, WorkoutSet[]>();
            const next = new Map(base);
            next.set(index, snap.docs.map(setFromDoc));
            return { key, chunks: next, error: null, fromCache: snap.metadata.fromCache };
          }),
        (error) => {
          console.error('[FitnessApp] exercise sets query failed', error);
          setState((prev) => ({ ...prev, key, error: 'No se pudo cargar el historial.' }));
        },
      ),
    );
    return () => unsubscribers.forEach((u) => u());
  }, [uid, key]);

  return useMemo(() => {
    if (key === '') return { data: [], loading: false, error: null, fromCache: false };
    const expectedChunks = Math.ceil(key.split(',').length / IN_LIMIT);
    const ready = state.key === key && state.chunks.size === expectedChunks;
    return {
      data: state.key === key ? [...state.chunks.values()].flat() : [],
      loading: !ready && !state.error,
      error: state.key === key ? state.error : null,
      fromCache: state.fromCache,
    };
  }, [key, state]);
}
