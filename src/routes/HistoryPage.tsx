import { Link } from 'react-router';
import { useData } from '../data/useData';
import { useActiveWorkout, useCompletedWorkouts } from '../hooks/useWorkouts';
import { InlineLoading } from '../ui/Loading';
import { PageHeader } from '../ui/PageHeader';
import { WorkoutCard } from '../ui/WorkoutCard';

export default function HistoryPage() {
  const { workouts } = useData();
  const completed = useCompletedWorkouts();
  const active = useActiveWorkout();

  return (
    <main className="page">
      <PageHeader title="Historial" />
      {active && (
        <Link to={`/entrenamiento/${active.id}`} className="banner">
          Tienes un entrenamiento en curso ({active.routineNameSnapshot}). Toca para continuar.
        </Link>
      )}
      {workouts.loading && <InlineLoading />}
      {workouts.error && (
        <div className="banner banner--error" role="alert">
          {workouts.error}
        </div>
      )}
      {!workouts.loading && completed.length === 0 && (
        <p className="empty">Aquí aparecerán tus entrenamientos terminados.</p>
      )}
      <ul className="list" style={{ gap: 10 }} aria-label="Entrenamientos">
        {completed.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </ul>
    </main>
  );
}
