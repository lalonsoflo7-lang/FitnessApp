import { useState } from 'react';
import { compareSessions, compareSetWithPrevious } from '../../analytics/compare';
import { volume } from '../../analytics/metrics';
import { detectSessionPRs, detectSetPRs } from '../../analytics/prs';
import type { WorkoutSet } from '../../domain/types';
import { suggestNextSet, type SetDraft } from '../../domain/workoutOps';
import type { SetValues } from '../../data/workoutsRepo';
import type { WorkoutExerciseData } from '../../hooks/useWorkoutExercises';
import { describePR, formatDate, formatSet, formatSigned, formatVolume } from '../../lib/format';
import { readJSON, removeKey, writeJSON } from '../../lib/storage';
import { StarIcon, TrashIcon } from '../../ui/icons';
import { DeltaBadge, PrBadge, SetTypeBadge } from './SetBadges';
import { SetForm } from './SetForm';

interface Props {
  workoutId: string;
  data: WorkoutExerciseData;
  historyLoading: boolean;
  onAdd: (values: SetValues) => void;
  onUpdate: (set: WorkoutSet, values: SetValues) => void;
  onDelete: (set: WorkoutSet) => void;
}

interface StoredDraft {
  /** Number of sets logged when the draft was saved; stale drafts are ignored. */
  count: number;
  draft: SetDraft;
}

const draftKey = (workoutId: string, exerciseId: string) =>
  `fitnessapp:draft:${workoutId}:${exerciseId}`;

function LastSession({ data, loading }: { data: WorkoutExerciseData; loading: boolean }) {
  if (loading && !data.previous) return <p className="small muted">Buscando última sesión…</p>;
  if (!data.previous) {
    return <p className="small muted">No hay historial todavía para este ejercicio.</p>;
  }
  return (
    <section aria-label="Última sesión" className="stack stack--s">
      <p className="section-title">
        Última sesión ·{' '}
        <span style={{ textTransform: 'none' }}>{formatDate(data.previous.date)}</span>
      </p>
      <ol className="ref-list num">
        {data.previous.sets.map((s) => (
          <li key={s.id} className={s.setType === 'warmup' ? 'faint' : undefined}>
            {formatSet(s.weight, s.reps)}
            {s.setType !== 'working' && (
              <span className="small faint"> ({s.setType === 'warmup' ? 'cal.' : 'drop'})</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function SetRow({
  set,
  index,
  data,
  onUpdate,
  onDelete,
}: {
  set: WorkoutSet;
  index: number;
  data: WorkoutExerciseData;
  onUpdate: Props['onUpdate'];
  onDelete: Props['onDelete'];
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const delta = compareSetWithPrevious(data.todaySets, index, data.previous?.sets ?? null);
  const before = [...data.priorSessions.flatMap((s) => s.sets), ...data.todaySets.slice(0, index)];
  const prs = detectSetPRs(set, before);

  if (editing) {
    return (
      <li className="card card--tight stack stack--s">
        <p className="section-title">Editar serie {set.setNumber}</p>
        <SetForm
          initial={{
            weight: String(set.weight),
            reps: String(set.reps),
            setType: set.setType,
            rir: set.rir,
          }}
          submitLabel="Guardar"
          onSubmit={(values) => {
            onUpdate(set, values);
            setEditing(false);
          }}
          secondaryActions={
            <button type="button" className="btn btn--xl" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          }
        />
        {!confirmDelete ? (
          <button
            type="button"
            className="btn btn--ghost"
            style={{ color: 'var(--danger)', marginTop: 8 }}
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon /> Eliminar serie
          </button>
        ) : (
          <div className="banner banner--error stack stack--s" role="alert">
            <p>¿Eliminar la serie {set.setNumber}? No se puede deshacer.</p>
            <div className="row">
              <button type="button" className="btn grow" onClick={() => setConfirmDelete(false)}>
                No
              </button>
              <button
                type="button"
                className="btn btn--danger grow"
                onClick={() => {
                  onDelete(set);
                  setEditing(false);
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className="set-row"
        aria-label={`Serie ${set.setNumber}: ${formatSet(set.weight, set.reps)}. Toca para editar`}
        onClick={() => setEditing(true)}
      >
        <span className="set-row__num num">{set.setNumber}</span>
        <span>
          <span className="set-row__main num">{formatSet(set.weight, set.reps)}</span>
          <span className="set-row__meta">
            <SetTypeBadge type={set.setType} />
            {set.rir !== null && <span className="badge">RIR {set.rir}</span>}
          </span>
        </span>
        <span className="set-row__feedback">
          <PrBadge prs={prs} />
          {delta && <DeltaBadge delta={delta} />}
        </span>
      </button>
    </li>
  );
}

export function ExercisePanel({
  workoutId,
  data,
  historyLoading,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const { snapshot, todaySets, previous } = data;
  const key = draftKey(workoutId, snapshot.exerciseId);
  const stored = readJSON<StoredDraft>(key);
  const suggestion = suggestNextSet(todaySets, previous?.sets ?? null);
  const initial = stored && stored.count === todaySets.length ? stored.draft : suggestion;
  const comparison = compareSessions(todaySets, previous?.sets ?? null);
  const todayVolume = volume(todaySets);
  const sessionPRs = detectSessionPRs(
    todaySets,
    data.priorSessions.map((session) => session.sets),
  );

  return (
    <section className="stack" aria-labelledby={`ex-${snapshot.exerciseId}`}>
      <h2 id={`ex-${snapshot.exerciseId}`} className="exercise-title">
        {snapshot.name}
      </h2>

      <div className="card card--tight">
        <LastSession data={data} loading={historyLoading} />
      </div>

      <section className="stack stack--s" aria-label="Series de hoy">
        <div className="row row--between">
          <h3 className="section-title">Hoy</h3>
          {todaySets.length > 0 && (
            <span className="small muted num">
              Volumen {formatVolume(todayVolume)}
              {comparison && (
                <>
                  {' '}
                  ({formatSigned(comparison.volumeDelta, ' kg')}
                  {!comparison.sameStructure && ' · distinto nº de series'})
                </>
              )}
            </span>
          )}
        </div>
        {sessionPRs.length > 0 && (
          <ul className="list pr-list" aria-label="Récords de hoy">
            {sessionPRs.map((pr, i) => (
              <li key={i} className="row small">
                <span className="badge badge--pr">
                  <StarIcon width={12} height={12} /> Nuevo récord
                </span>
                <span>{describePR(pr)}</span>
              </li>
            ))}
          </ul>
        )}
        {todaySets.length === 0 ? (
          <p className="small muted">Aún no registras series de este ejercicio.</p>
        ) : (
          <ol className="list" aria-label={`Series de ${snapshot.name}`}>
            {todaySets.map((set, index) => (
              <SetRow
                key={set.id}
                set={set}
                index={index}
                data={data}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </ol>
        )}
      </section>

      <div className="card">
        <SetForm
          // Remount after each new set (next suggestion) and when the previous session arrives
          // from the cache. Anything already typed survives via the stored draft.
          key={`${snapshot.exerciseId}:${todaySets.length}:${previous?.workoutId ?? '-'}`}
          initial={initial}
          submitLabel={`Registrar serie ${todaySets.length + 1}`}
          onDraftChange={(draft) => writeJSON(key, { count: todaySets.length, draft })}
          onSubmit={(values) => {
            removeKey(key);
            onAdd(values);
          }}
          secondaryActions={null}
        />
      </div>
    </section>
  );
}
