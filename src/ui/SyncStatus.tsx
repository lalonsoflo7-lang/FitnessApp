import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useWriteState } from '../hooks/useWriteState';

/** Discreet connectivity / pending-sync indicator. Hidden when everything is synced. */
export function SyncStatus() {
  const online = useOnlineStatus();
  const { pending } = useWriteState();
  if (online && pending === 0) return null;
  const label = !online
    ? pending > 0
      ? 'Sin conexión · cambios guardados en el teléfono'
      : 'Sin conexión'
    : 'Sincronizando…';
  return (
    <span
      className={`status-pill${online ? '' : ' status-pill--offline'}`}
      role="status"
      aria-live="polite"
    >
      <span className="dot" aria-hidden="true" />
      {label}
    </span>
  );
}
