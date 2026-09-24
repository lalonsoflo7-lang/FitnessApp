import { useState } from 'react';
import { signOut } from '../auth/authActions';
import { useAuth } from '../auth/useAuth';
import { useWriteState } from '../hooks/useWriteState';
import { removeKeysWithPrefix } from '../lib/storage';
import { Dialog } from './Dialog';

export function AccountSection() {
  const { user } = useAuth();
  const { pending } = useWriteState();
  const [confirm, setConfirm] = useState(false);

  async function doSignOut() {
    removeKeysWithPrefix('fitnessapp:');
    await signOut();
  }

  return (
    <section className="stack stack--s danger-zone" aria-label="Cuenta">
      <p className="small faint">
        Sesión iniciada como {user?.email ?? user?.displayName ?? 'usuario'}
      </p>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => (pending > 0 ? setConfirm(true) : void doSignOut())}
      >
        Cerrar sesión
      </button>
      <Dialog
        open={confirm}
        title="Hay cambios sin sincronizar"
        onClose={() => setConfirm(false)}
        actions={
          <>
            <button
              type="button"
              className="btn btn--primary"
              data-autofocus
              onClick={() => setConfirm(false)}
            >
              Esperar a sincronizar
            </button>
            <button type="button" className="btn btn--danger" onClick={() => void doSignOut()}>
              Cerrar sesión de todos modos
            </button>
          </>
        }
      >
        <p className="muted">
          Tienes {pending} {pending === 1 ? 'cambio pendiente' : 'cambios pendientes'} de subir.
          Conéctate a internet y espera unos segundos antes de cerrar sesión para no perderlos.
        </p>
      </Dialog>
    </section>
  );
}
