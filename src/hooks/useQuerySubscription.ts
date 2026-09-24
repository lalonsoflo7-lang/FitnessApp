import { useEffect, useState } from 'react';
import {
  onSnapshot,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

export interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  /** True when the data comes from the local cache only (e.g. offline). */
  fromCache: boolean;
}

const INITIAL = { data: [], loading: true, error: null, fromCache: false };

const IDLE = { data: [], loading: false, error: null, fromCache: false };

/**
 * Live subscription to a Firestore query. `key` must change whenever the query changes;
 * pass `null` to stay idle (e.g. while an id is still unknown).
 */
export function useQuerySubscription<T>(
  key: string | null,
  makeQuery: () => Query<DocumentData>,
  map: (snap: QueryDocumentSnapshot<DocumentData>) => T,
): QueryState<T> {
  const [state, setState] = useState<QueryState<T> & { key: string | null }>({ ...INITIAL, key });

  useEffect(() => {
    if (key === null) return;
    const q = makeQuery();
    return onSnapshot(
      q,
      (snap) =>
        setState({
          data: snap.docs.map(map),
          loading: false,
          error: null,
          fromCache: snap.metadata.fromCache,
          key,
        }),
      (error) => {
        console.error('[FitnessApp] query failed', key, error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error.code === 'permission-denied'
              ? 'No tienes permiso para leer estos datos.'
              : 'No se pudieron cargar los datos.',
          key,
        }));
      },
    );
    // makeQuery/map are expected to be derived from `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (key === null) return IDLE as QueryState<T>;
  // While the key changes, don't show stale data from the previous query.
  if (state.key !== key) return INITIAL as QueryState<T>;
  return state;
}
