import { Link } from 'react-router';
import { useData } from '../data/useData';
import { useActiveWorkout, useCompletedWorkouts } from '../hooks/useWorkouts';
import { buildRecentHighlights } from '../analytics/highlights';
import { WorkoutCard } from '../ui/WorkoutCard';
import { formatTime } from '../lib/format';
import { PageHeader } from '../ui/PageHeader';
import { SyncStatus } from '../ui/SyncStatus';
import { StartWorkoutButton } from '../ui/StartWorkoutButton';
import { InlineLoading } from '../ui/Loading';
import { PlayIcon, StarIcon } from '../ui/icons';

export function HomePage() {
  const { routines, workouts } = useData();
  const active = useActiveWorkout();
  const completed = useCompletedWorkouts();
  // Most recently used routines first, then the rest alphabetically.
  const lastUsed = new Map<string, number>();
  for (const w of completed) {
    if (w.sourceRoutineId && !lastUsed.has(w.sourceRoutineId)) {
      lastUsed.set(w.sourceRoutineId, w.startedAt.getTime());
    }
  }
  const available = routines.data
    .filter((r) => !r.archived)
    .sort(
      (a, b) =>
        (lastUsed.get(b.id) ?? 0) - (lastUsed.get(a.id) ?? 0) || a.name.localeCompare(b.name, 'es'),
    );
  const highlights = buildRecentHighlights(completed);
  const recent = completed.slice(0, 3);

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

      {recent.length > 0 && (
        <section className="stack stack--s" aria-labelledby="recent-title">
          <div className="row row--between">
            <h2 id="recent-title" className="section-title">
              Actividad reciente
            </h2>
            <Link to="/historial" className="small">
              Ver todo
            </Link>
          </div>
          <ul className="list" style={{ gap: 10 }}>
            {recent.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </ul>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="stack stack--s" aria-labelledby="progress-title">
          <h2 id="progress-title" className="section-title">
            Progreso reciente
          </h2>
          <ul className="list">
            {highlights.map((h) => (
              <li key={h.exerciseId}>
                <Link
                  to={`/progreso/${h.exerciseId}`}
                  className="list-item"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <span className="grow">{h.name}</span>
                  {h.kind === 'pr' ? (
                    <span className="badge badge--pr">
                      <StarIcon width={12} height={12} /> {h.text}
                    </span>
                  ) : (
                    <span className="badge badge--up">▲ {h.text}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
