import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { buildExerciseProgress } from '../../analytics/exerciseProgress';
import { groupExerciseSessions } from '../../analytics/history';
import { useData } from '../../data/useData';
import { useExerciseSets } from '../../hooks/useSets';
import { useWorkoutsById } from '../../hooks/useWorkouts';
import {
  describePR,
  formatDate,
  formatE1rm,
  formatSet,
  formatShortDate,
  formatVolume,
  formatWeight,
} from '../../lib/format';
import { InlineLoading } from '../../ui/Loading';
import { PageHeader } from '../../ui/PageHeader';
import { StarIcon } from '../../ui/icons';
import { SetTypeBadge } from '../workout/SetBadges';
import ProgressChart from './ProgressChart';
import { CHART_METRICS, type ChartMetric } from './chartMetrics';

const HISTORY_PAGE = 10;

export default function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams();
  const { uid, exercises } = useData();
  const workoutsById = useWorkoutsById();
  const ids = useMemo(() => [exerciseId], [exerciseId]);
  const sets = useExerciseSets(uid, ids);
  const [metric, setMetric] = useState<ChartMetric>('bestE1rm');
  const [shown, setShown] = useState(HISTORY_PAGE);

  const sessions = useMemo(
    () => groupExerciseSessions(sets.data, workoutsById),
    [sets.data, workoutsById],
  );
  const progress = useMemo(() => buildExerciseProgress(sessions), [sessions]);
  const exercise = exercises.data.find((e) => e.id === exerciseId);
  const lastSnapshotName = sessions[sessions.length - 1]?.sets[0]?.exerciseNameSnapshot;
  const name = exercise?.name ?? lastSnapshotName ?? 'Ejercicio';
  const newestFirst = [...sessions].reverse();
  const prTimeline = [...progress.points].reverse().filter((p) => p.prs.length > 0);
  const last = progress.last;
  const metricMeta = CHART_METRICS.find((m) => m.id === metric)!;

  return (
    <main className="page">
      <PageHeader title={name} back="/progreso" />
      {sets.loading && <InlineLoading label="Cargando historial…" />}
      {sets.error && (
        <div className="banner banner--error" role="alert">
          {sets.error}
        </div>
      )}
      {!sets.loading && progress.sessionCount === 0 && (
        <p className="empty">No hay historial todavía para este ejercicio.</p>
      )}

      {progress.sessionCount > 0 && (
        <>
          <section className="card stack stack--s" aria-label="Resumen del ejercicio">
            {last && (
              <p className="muted">
                Última sesión: {formatDate(last.date)}
                {last.bestSet && ` · mejor ${formatSet(last.bestSet.weight, last.bestSet.reps)}`}
              </p>
            )}
            <div className="stat-grid num">
              <div>
                <span className="stat-grid__label">Peso máximo</span>
                <span className="stat-grid__value">{formatWeight(progress.maxWeight)}</span>
              </div>
              <div>
                <span className="stat-grid__label">1RM estimado</span>
                <span className="stat-grid__value">{formatE1rm(progress.bestE1rm)}</span>
              </div>
              <div>
                <span className="stat-grid__label">Mejor serie</span>
                <span className="stat-grid__value">
                  {progress.bestSet
                    ? formatSet(progress.bestSet.weight, progress.bestSet.reps)
                    : '—'}
                </span>
              </div>
              <div>
                <span className="stat-grid__label">Volumen máx.</span>
                <span className="stat-grid__value">
                  {progress.maxVolume !== null ? formatVolume(progress.maxVolume) : '—'}
                </span>
              </div>
              <div>
                <span className="stat-grid__label">Sesiones</span>
                <span className="stat-grid__value">{progress.sessionCount}</span>
              </div>
            </div>
            <p className="small faint">
              1RM estimado con Epley (peso × (1 + reps/30)) en series de 1 a 12 reps; no es un
              levantamiento real. Mejor serie = la de mayor 1RM estimado.
            </p>
          </section>

          <section className="card stack stack--s" aria-labelledby="chart-title">
            <h2 id="chart-title" className="section-title">
              Evolución · {metricMeta.label}
            </h2>
            <div className="segmented" role="group" aria-label="Métrica de la gráfica">
              {CHART_METRICS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={metric === m.id}
                  onClick={() => setMetric(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <ProgressChart points={progress.points} metric={metric} />
            <p className="small faint">
              <StarIcon width={12} height={12} style={{ color: 'var(--pr)' }} /> Marcador grande =
              sesión con récord. Los datos exactos están en el historial de abajo.
            </p>
          </section>

          {prTimeline.length > 0 && (
            <section className="stack stack--s" aria-labelledby="prs-title">
              <h2 id="prs-title" className="section-title">
                Récords personales
              </h2>
              <ul className="list">
                {prTimeline.slice(0, 8).map((p) => (
                  <li key={p.workoutId} className="card card--tight stack stack--s">
                    <span className="small muted">{formatDate(p.date)}</span>
                    {p.prs.map((pr, i) => (
                      <span key={i} className="row small">
                        <span className="badge badge--pr">
                          <StarIcon width={12} height={12} /> PR
                        </span>
                        {describePR(pr)}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {progress.repRecords.length > 0 && (
            <section className="card stack stack--s" aria-labelledby="rep-records-title">
              <h2 id="rep-records-title" className="section-title">
                Máximo de repeticiones por peso
              </h2>
              <table className="history-table num">
                <thead>
                  <tr>
                    <th scope="col">Peso</th>
                    <th scope="col">Mejor marca</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.repRecords.slice(0, 8).map((r) => (
                    <tr key={r.weight}>
                      <td>{formatWeight(r.weight)}</td>
                      <td>{r.reps} reps</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="stack stack--s" aria-labelledby="sessions-title">
            <h2 id="sessions-title" className="section-title">
              Historial ({sessions.length})
            </h2>
            <ol className="list" style={{ gap: 10 }}>
              {newestFirst.slice(0, shown).map((s) => {
                const point = progress.points.find((p) => p.workoutId === s.workoutId);
                return (
                  <li key={s.workoutId} className="card card--tight stack stack--s">
                    <div className="row row--between">
                      <Link to={`/historial/${s.workoutId}`} className="small">
                        {formatShortDate(s.date)} · {s.routineName}
                      </Link>
                      {point && (
                        <span className="small muted num">{formatVolume(point.volume)}</span>
                      )}
                    </div>
                    <ul className="ref-list num">
                      {s.sets.map((set) => (
                        <li key={set.id} className={set.setType === 'warmup' ? 'faint' : undefined}>
                          {formatSet(set.weight, set.reps)} <SetTypeBadge type={set.setType} />
                          {set.rir !== null && <span className="small faint"> RIR {set.rir}</span>}
                        </li>
                      ))}
                    </ul>
                    {point && point.prs.length > 0 && (
                      <span className="badge badge--pr" style={{ alignSelf: 'flex-start' }}>
                        <StarIcon width={12} height={12} /> {point.prs.length} PR
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {sessions.length > shown && (
              <button
                type="button"
                className="btn"
                onClick={() => setShown((n) => n + HISTORY_PAGE)}
              >
                Ver más sesiones
              </button>
            )}
          </section>
        </>
      )}
    </main>
  );
}
