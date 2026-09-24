import { useState } from 'react';
import { Link } from 'react-router';
import { useData, useExercisesById } from '../data/useData';
import type { Routine } from '../domain/types';
import { PageHeader } from '../ui/PageHeader';
import { RoutinesTabs } from '../ui/RoutinesTabs';
import { InlineLoading } from '../ui/Loading';
import { EditIcon, PlusIcon } from '../ui/icons';
import { StartWorkoutButton } from '../ui/StartWorkoutButton';

function RoutineCard({ routine }: { routine: Routine }) {
  const exercisesById = useExercisesById();
  const names = routine.exerciseIds.map((id) => exercisesById.get(id)?.name ?? '…');
  return (
    <li className="card stack stack--s" aria-label={`Rutina ${routine.name}`}>
      <div className="row row--between">
        <div className="grow">
          <h2>{routine.name}</h2>
          <p className="small muted">
            {routine.exerciseIds.length === 1
              ? '1 ejercicio'
              : `${routine.exerciseIds.length} ejercicios`}
          </p>
        </div>
        <Link
          to={`/rutinas/${routine.id}`}
          className="btn btn--ghost btn--icon"
          aria-label={`Editar ${routine.name}`}
        >
          <EditIcon />
        </Link>
      </div>
      {names.length > 0 && <p className="small faint">{names.join(' · ')}</p>}
      {!routine.archived && <StartWorkoutButton routine={routine} />}
    </li>
  );
}

export default function RoutinesPage() {
  const { routines } = useData();
  const [showArchived, setShowArchived] = useState(false);
  const active = routines.data
    .filter((r) => !r.archived)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const archived = routines.data.filter((r) => r.archived);

  return (
    <main className="page">
      <PageHeader
        title="Rutinas"
        actions={
          <Link to="/rutinas/nueva" className="btn btn--primary">
            <PlusIcon /> Nueva
          </Link>
        }
      />
      <RoutinesTabs />
      {routines.loading && <InlineLoading />}
      {routines.error && (
        <div className="banner banner--error" role="alert">
          {routines.error}
        </div>
      )}
      {!routines.loading && active.length === 0 && (
        <div className="empty stack">
          <p>Aún no tienes rutinas.</p>
          <Link to="/rutinas/nueva" className="btn btn--primary">
            Crear mi primera rutina
          </Link>
        </div>
      )}
      <ul className="list" style={{ gap: 12 }}>
        {active.map((r) => (
          <RoutineCard key={r.id} routine={r} />
        ))}
      </ul>
      {archived.length > 0 && (
        <section className="stack stack--s">
          <button
            type="button"
            className="btn btn--ghost"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? 'Ocultar' : 'Ver'} archivadas ({archived.length})
          </button>
          {showArchived && (
            <ul className="list" style={{ gap: 12 }}>
              {archived.map((r) => (
                <RoutineCard key={r.id} routine={r} />
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
