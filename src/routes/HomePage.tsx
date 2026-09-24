import { Link } from 'react-router';
import { useData } from '../data/useData';
import { useActiveWorkout } from '../hooks/useWorkouts';
import { formatTime } from '../lib/format';
import { PageHeader } from '../ui/PageHeader';
import { SyncStatus } from '../ui/SyncStatus';
import { StartWorkoutButton } from '../ui/StartWorkoutButton';
import { InlineLoading } from '../ui/Loading';
import { PlayIcon } from '../ui/icons';

export function HomePage() {
  const { routines, workouts } = useData();
  const active = useActiveWorkout();
  const available = routines.data.filter((r) => !r.archived);

  return (
    <main className="page">
      <PageHeader title="Inicio" actions={<SyncStatus />} />

      {active && (
        <Link to={`/entrenamiento/${active.id}`} className="card card--link continue-card">
          <p className="section-title">Entrenamiento en curso</p>
          <p className="continue-card__title">{active.routineNameSnapshot}</p>
          <p className="small muted">Iniciado a las {formatTime(active.startedAt)}</p>
          <span className="btn btn--primary btn--xl btn--block" style={{ marginTop: 12 }}>
            <PlayIcon /> Continuar entrenamiento
          </span>
        </Link>
      )}

      {!active && (
        <section className="stack" aria-labelledby="start-title">
          <h2 id="start-title" className="section-title">
            Iniciar entrenamiento
          </h2>
          {(routines.loading || workouts.loading) && <InlineLoading />}
          {!routines.loading && available.length === 0 && (
            <div className="empty stack">
              <p>Crea una rutina para empezar a registrar tus entrenamientos.</p>
              <Link to="/rutinas/nueva" className="btn btn--primary">
                Crear rutina
              </Link>
            </div>
          )}
          <ul className="list" style={{ gap: 12 }}>
            {available.map((r) => (
              <li key={r.id} className="card card--tight stack stack--s">
                <div className="row row--between">
                  <h3>{r.name}</h3>
                  <span className="small muted">{r.exerciseIds.length} ejercicios</span>
                </div>
                <StartWorkoutButton routine={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
