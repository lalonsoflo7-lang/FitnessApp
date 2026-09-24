/**
 * Firestore write promises only resolve once the server acknowledges them, so while offline
 * they stay pending. The UI must never await them (local cache already reflects the change);
 * instead every write is registered here so we can show "pending sync" and surface errors.
 */
type Listener = () => void;

export interface WriteTrackerState {
  pending: number;
  lastError: string | null;
}

let state: WriteTrackerState = { pending: 0, lastError: null };
const listeners = new Set<Listener>();

function emit(next: WriteTrackerState) {
  state = next;
  listeners.forEach((l) => l());
}

export function subscribeWrites(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWriteState(): WriteTrackerState {
  return state;
}

export function clearWriteError() {
  emit({ ...state, lastError: null });
}

function describeWriteError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'permission-denied') {
    return 'Firebase rechazó un cambio (permiso denegado). Tus datos anteriores siguen intactos.';
  }
  return 'No se pudo guardar un cambio en la nube. Inténtalo de nuevo.';
}

export function trackWrite(promise: Promise<unknown>): void {
  emit({ ...state, pending: state.pending + 1 });
  promise
    .catch((error: unknown) => {
      console.error('[FitnessApp] write failed', error);
      emit({ ...state, lastError: describeWriteError(error) });
    })
    .finally(() => emit({ ...state, pending: Math.max(0, state.pending - 1) }));
}
