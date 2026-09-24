import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useData } from '../data/useData';
import type { ExerciseSummary } from '../domain/types';
import { normalizeName } from '../domain/validation';
import { useCompletedWorkouts } from '../hooks/useWorkouts';
import { formatSet, formatShortDate } from '../lib/format';
import { PageHeader } from '../ui/PageHeader';
import { InlineLoading } from '../ui/Loading';
import { ChevronRightIcon, StarIcon } from '../ui/icons';

interface Row {
  exerciseId: string;
  name: string;
  last: { date: Date; summary: ExerciseSummary } | null;
}

export default function ProgressPage() {
  const { exercises } = useData();
  const completed = useCompletedWorkouts();
  const [term, setTerm] = useState('');

  const rows = useMemo<Row[]>(() => {
    // Latest summary per exercise, from the summaries already stored on workouts (no extra reads).
    const latest = new Map<string, { date: Date; summary: ExerciseSummary }>();
    for (const w of completed) {
      for (const ex of w.summary?.exercises ?? []) {
        if (!latest.has(ex.exerciseId))
          latest.set(ex.exerciseId, { date: w.startedAt, summary: ex });
      }
    }
    const list: Row[] = exercises.data
      .filter((e) => !e.archived || latest.has(e.id))
      .map((e) => ({ exerciseId: e.id, name: e.name, last: latest.get(e.id) ?? null }));
    return list.sort(
      (a, b) =>
        (b.last?.date.getTime() ?? 0) - (a.last?.date.getTime() ?? 0) ||
        a.name.localeCompare(b.name, 'es'),
    );
  }, [exercises.data, completed]);

  const key = normalizeName(term);
  const visible = rows.filter((r) => key === '' || normalizeName(r.name).includes(key));

  return (
    <main className="page">
      <PageHeader title="Progreso" />
      <label htmlFor="progress-search" className="visually-hidden">
        Buscar ejercicio
      </label>
      <input
        id="progress-search"
        className="input"
        type="search"
        placeholder="Buscar ejercicio"
        autoComplete="off"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {exercises.loading && <InlineLoading />}
      {!exercises.loading && rows.length === 0 && (
        <p className="empty">
          Cuando registres entrenamientos verás aquí tu evolución por ejercicio.
        </p>
      )}
      <ul className="list" aria-label="Ejercicios">
        {visible.map((r) => (
          <li key={r.exerciseId}>
            <Link
              to={`/progreso/${r.exerciseId}`}
              className="list-item"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <span className="grow" style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 650 }}>{r.name}</span>
                <span className="small muted num">
                  {r.last
                    ? `${formatShortDate(r.last.date)}${
                        r.last.summary.bestSet
                          ? ` · mejor ${formatSet(r.last.summary.bestSet.weight, r.last.summary.bestSet.reps)}`
                          : ''
                      }`
                    : 'Sin historial todavía'}
                </span>
              </span>
              {r.last && r.last.summary.prs.length > 0 && (
                <span className="badge badge--pr">
                  <StarIcon width={12} height={12} /> PR
                </span>
              )}
              <ChevronRightIcon width={20} height={20} className="faint" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
