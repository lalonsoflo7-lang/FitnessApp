import { clearWriteError } from '../data/writeTracker';
import { useWriteState } from '../hooks/useWriteState';

export function WriteErrorToast() {
  const { lastError } = useWriteState();
  if (!lastError) return null;
  return (
    <div className="toast" role="alert">
      <span className="small">{lastError}</span>
      <button type="button" className="btn btn--ghost" onClick={clearWriteError}>
        Cerrar
      </button>
    </div>
  );
}
