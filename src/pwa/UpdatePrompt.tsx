import { useSyncExternalStore } from 'react';
import { applyUpdate, dismissUpdate, getSwState, subscribeSw } from './serviceWorker';

export function UpdatePrompt() {
  const { needRefresh } = useSyncExternalStore(subscribeSw, getSwState, getSwState);
  if (!needRefresh) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="small">Hay una nueva versión de FitnessApp.</span>
      <div className="row">
        <button type="button" className="btn btn--ghost" onClick={dismissUpdate}>
          Luego
        </button>
        <button type="button" className="btn btn--primary" onClick={applyUpdate}>
          Actualizar
        </button>
      </div>
    </div>
  );
}
