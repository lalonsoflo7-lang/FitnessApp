import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { useData } from '../data/useData';
import type { ExerciseSummary } from '../domain/types';
import { buildWorkoutView, type WorkoutViewExercise } from '../domain/workoutView';
import { useWorkoutSets } from '../hooks/useSets';
import {
  describePR,
  formatDate,
  formatDuration,
  formatE1rm,
  formatSet,
  formatSigned,
  formatTime,
  formatVolume,
} from '../lib/format';
import { FullScreenLoading, InlineLoading } from '../ui/Loading';
import { PageHeader } from '../ui/PageHeader';
import { StarIcon } from '../ui/icons';
import { SetTypeBadge } from './workout/SetBadges';

function Comparison({ summary }: { summary: ExerciseSummary }) {
  const c = summary.comparison;
  if (!c) return <p className="small faint">Primera vez registrada (sin comparación).</p>;
  const parts: string[] = [];
  if (c.topWeightDelta !== null && c.topWeightDelta !== 0) {
    parts.push(`Peso máx. ${formatSigned(c.topWeightDelta, ' kg')}`);
  }
  if (c.e1rmDelta !== null && c.e1rmDelta !== 0) {
    parts.push(`1RM est. ${formatSigned(c.e1rmDelta, ' kg')}`);
  }
  parts.push(`Volumen ${formatSigned(c.volumeDelta, ' kg')}`);
  return (
    <p className="small muted">
      vs. sesión anterior: {parts.join(' · ')}
      {!c.sameStructure && (
        <span className="faint">
          {' '}
          (antes {c.previousMetricSets}, hoy {c.currentMetricSets} series efectivas)
        </span>
      )}
    </p>
  );
}

function ExerciseBlock({ exercise }: { exercise: WorkoutViewExercise }) {
  const s = exercise.summary;
  return (
    <li className="card stack stack--s" aria-label={exercise.name}>
      <div className="row row--between">
        <h2 style={{ fontSize: '1.1rem' }}>
          <Link to={`/progreso/${exercise.exerciseId}`} style={{ color: 'inherit' }}>
            {exercise.name}
          </Link>
        </h2>
        {s && <span className="small muted num">{formatVolume(s.volume)}</span>}
      </div>
      {exercise.sets.length === 0 ? (
        <p className="small faint">No realizado</p>
      ) : (
        <table className="history-table num">
          <thead>
            <tr>
              <th scope="col">Serie</th>
              <th scope="col">Peso × reps</th>
              <th scope="col">Tipo</th>
              <th scope="col">RIR</th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((set) => (
              <tr key={set.id} className={set.setType === 'warmup' ? 'faint' : undefined}>
                <td>{set.setNumber}</td>
                <td>{formatSet(set.weight, set.reps)}</td>
                <td>
                  {set.setType === 'working' ? (
                    <span className="small muted">Efectiva</span>
                  ) : (
                    <SetTypeBadge type={set.setType} />
                  )}
                </td>
                <td>{set.rir ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {s && s.bestSet && (
        <p className="small muted">
          Mejor serie {formatSet(s.bestSet.weight, s.bestSet.reps)}
          {s.bestE1rm !== null && ` · 1RM estimado ${formatE1rm(s.bestE1rm)}`}
        </p>
      )}
      {s && <Comparison summary={s} />}
      {s && s.prs.length > 0 && (
        <ul className="list" aria-label={`Récords en ${exercise.name}`} style={{ gap: 4 }}>
          {s.prs.map((pr, i) => (
            <li key={i} className="row small">
              <span className="badge badge--pr">
                <StarIcon width={12} height={12} /> PR
              </span>
              {describePR(pr)}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function WorkoutDetailPage() {
  const { workoutId } = useParams();
  const [params] = useSearchParams();
  const { uid, workouts } = useData();
  const workout = workouts.data.find((w) => w.id === workoutId);
  const sets = useWorkoutSets(uid, workout ? workout.id : null);

  if (!workout) {
    if (workouts.loading) return <FullScreenLoading />;
    return (
      <main className="page">
        <PageHeader title="Entrenamiento no encontrado" back="/historial" />
      </main>
    );
  }
  if (workout.status === 'active') return <Navigate to={`/entrenamiento/${workout.id}`} replace />;

  const view = buildWorkoutView(workout, sets.data);
  const s = workout.summary;
  const justFinished = params.get('terminado') === '1';

  return (
    <main className="page">
      <PageHeader title={workout.routineNameSnapshot} back="/historial" />
      {justFinished && (
        <div className="banner" role="status">
          <span>
            ✓ Entrenamiento guardado
            {s && s.prCount > 0
              ? ` · ${s.prCount} ${s.prCount === 1 ? 'récord' : 'récords'} nuevo(s)`
              : ''}
            .
          </span>
        </div>
      )}
      <section className="card stack stack--s" aria-label="Resumen">
        <p className="muted">
          {formatDate(workout.startedAt, { weekday: 'long', year: 'numeric' })} ·{' '}
          {formatTime(workout.startedAt)}
        </p>
        {s && (
          <div className="stat-grid num">
            <div>
              <span className="stat-grid__label">Duración</span>
              <span className="stat-grid__value">{formatDuration(s.durationSec)}</span>
            </div>
            <div>
              <span className="stat-grid__label">Volumen</span>
              <span className="stat-grid__value">{formatVolume(s.totalVolume)}</span>
            </div>
            <div>
              <span className="stat-grid__label">Series</span>
              <span className="stat-grid__value">{s.totalSets}</span>
            </div>
            <div>
              <span className="stat-grid__label">Récords</span>
              <span className="stat-grid__value">{s.prCount}</span>
            </div>
          </div>
        )}
        <p className="small faint">
          Volumen = Σ peso × reps de series efectivas y drop sets (sin calentamiento).
        </p>
      </section>
      {sets.loading && <InlineLoading />}
      <ol className="list" style={{ gap: 12 }} aria-label="Ejercicios del entrenamiento">
        {view.map((e) => (
          <ExerciseBlock key={e.exerciseId} exercise={e} />
        ))}
      </ol>
    </main>
  );
}
