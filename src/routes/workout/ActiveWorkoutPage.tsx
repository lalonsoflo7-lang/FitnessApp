import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { buildWorkoutSummary } from '../../analytics/summary';
import { DOUBLE_TAP_GUARD_MS } from '../../config/constants';
import { useData } from '../../data/useData';
import {
  addSet,
  deleteSet,
  discardWorkout,
  finishWorkout,
  updateSet,
  type SetValues,
} from '../../data/workoutsRepo';
import type { WorkoutSession, WorkoutSet } from '../../domain/types';
import { nextSetNumber, renumberAfterDelete } from '../../domain/workoutOps';
import { useWorkoutExercises } from '../../hooks/useWorkoutExercises';
import { readJSON, removeKeysWithPrefix, writeJSON } from '../../lib/storage';
import { Dialog } from '../../ui/Dialog';
import { FullScreenLoading } from '../../ui/Loading';
import { SyncStatus } from '../../ui/SyncStatus';
import { WriteErrorToast } from '../../ui/WriteErrorToast';
import { ChevronRightIcon, CheckIcon, BackIcon } from '../../ui/icons';
import { ElapsedTime } from './ElapsedTime';
import { ExercisePanel } from './ExercisePanel';

const positionKey = (workoutId: string) => `fitnessapp:position:${workoutId}`;

export default function ActiveWorkoutPage() {
  const { workoutId } = useParams();
  const { workouts } = useData();
  const workout = workouts.data.find((w) => w.id === workoutId);

  if (!workout) {
    if (workouts.loading) return <FullScreenLoading label="Recuperando entrenamiento…" />;
    return (
      <main className="page page--bare">
        <h1>Entrenamiento no encontrado</h1>
        <p className="muted">Puede que se haya descartado.</p>
        <Link to="/" className="btn btn--primary">
          Ir al inicio
        </Link>
      </main>
    );
  }
  if (workout.status === 'completed') return <Navigate to={`/historial/${workout.id}`} replace />;
  return <ActiveWorkout workout={workout} />;
}

function ActiveWorkout({ workout }: { workout: WorkoutSession }) {
  const { uid } = useData();
  const navigate = useNavigate();
  const { exercises, loading, error } = useWorkoutExercises(uid, workout);
  const lastAdd = useRef<{ at: number; signature: string }>({ at: 0, signature: '' });
  const finishing = useRef(false);

  const [index, setIndexState] = useState(() => {
    const saved = readJSON<number>(positionKey(workout.id));
    return typeof saved === 'number' && saved >= 0 && saved < workout.exercises.length ? saved : 0;
  });
  const setIndex = useCallback(
    (i: number) => {
      setIndexState(i);
      writeJSON(positionKey(workout.id), i);
      window.scrollTo({ top: 0 });
    },
    [workout.id],
  );

  const [dialog, setDialog] = useState<'finish' | 'discard' | null>(null);
  const [discardConfirmed, setDiscardConfirmed] = useState(false);

  const current = exercises[index] ?? exercises[0];
  const totalSets = useMemo(
    () => exercises.reduce((n, e) => n + e.todaySets.length, 0),
    [exercises],
  );
  const doneExercises = exercises.filter((e) => e.todaySets.length > 0).length;
  const skipped = exercises.length - doneExercises;

  function handleAdd(values: SetValues) {
    if (!current) return;
    // Double-tap guard: an identical set on the same exercise a few ms later is an accidental
    // second tap (the form is re-filled with the same values), not a new set.
    const now = Date.now();
    const signature = JSON.stringify([current.snapshot.exerciseId, values]);
    if (now - lastAdd.current.at < DOUBLE_TAP_GUARD_MS && signature === lastAdd.current.signature) {
      return;
    }
    lastAdd.current = { at: now, signature };
    addSet(uid, workout, current.snapshot, nextSetNumber(current.todaySets), values);
  }

  function handleUpdate(set: WorkoutSet, values: SetValues) {
    updateSet(uid, set.id, values);
  }

  function handleDelete(set: WorkoutSet) {
    const siblings = exercises.find((e) => e.snapshot.exerciseId === set.exerciseId)?.todaySets;
    deleteSet(uid, set.id, renumberAfterDelete(siblings ?? [], set.id));
  }

  function clearLocalState() {
    removeKeysWithPrefix(`fitnessapp:draft:${workout.id}:`);
    removeKeysWithPrefix(positionKey(workout.id));
  }

  function handleFinish() {
    if (finishing.current || totalSets === 0) return;
    finishing.current = true;
    const finishedAt = new Date();
    const summary = buildWorkoutSummary({
      startedAt: workout.startedAt,
      finishedAt,
      exercises: workout.exercises,
      sets: exercises.flatMap((e) => e.todaySets),
      priorSessionsByExercise: new Map(
        exercises.map((e) => [e.snapshot.exerciseId, e.priorSessions.map((s) => s.sets)]),
      ),
    });
    finishWorkout(uid, workout.id, summary, finishedAt);
    clearLocalState();
    navigate(`/historial/${workout.id}?terminado=1`, { replace: true });
  }

  function handleDiscard() {
    if (finishing.current) return;
    finishing.current = true;
    discardWorkout(
      uid,
      workout.id,
      exercises.flatMap((e) => e.todaySets.map((s) => s.id)),
    );
    clearLocalState();
    navigate('/', { replace: true });
  }

  const next = exercises[index + 1];

  return (
    <div className="shell">
      <header className="workout-header">
        <div className="workout-header__inner">
          <Link
            to="/"
            className="btn btn--ghost btn--icon"
            aria-label="Salir al inicio (el entrenamiento sigue activo)"
          >
            <BackIcon />
          </Link>
          <div className="grow" style={{ minWidth: 0 }}>
            <p className="workout-header__title">{workout.routineNameSnapshot}</p>
            <p className="small muted num workout-header__sub">
              <ElapsedTime since={workout.startedAt} /> · {doneExercises}/{exercises.length}{' '}
              ejercicios · {totalSets} {totalSets === 1 ? 'serie' : 'series'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setDialog('finish')}
            disabled={loading}
          >
            <CheckIcon /> Finalizar
          </button>
        </div>
      </header>

      <main className="page page--bare" style={{ paddingTop: 12 }}>
        <SyncStatus />
        {error && (
          <div className="banner banner--error" role="alert">
            {error} Puedes seguir registrando series.
          </div>
        )}
        <nav aria-label="Ejercicios del entrenamiento">
          <div className="exercise-tabs">
            {exercises.map((e, i) => (
              <button
                key={e.snapshot.exerciseId}
                type="button"
                className={`exercise-tab${e.todaySets.length > 0 ? ' exercise-tab--done' : ''}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => setIndex(i)}
              >
                <span>{e.snapshot.name}</span>
                <span
                  className="exercise-tab__count num"
                  aria-label={`${e.todaySets.length} series`}
                >
                  {e.todaySets.length}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {current && (
          <ExercisePanel
            key={current.snapshot.exerciseId}
            workoutId={workout.id}
            data={current}
            historyLoading={loading}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}

        {next ? (
          <button
            type="button"
            className="btn btn--block btn--xl"
            onClick={() => setIndex(index + 1)}
          >
            Siguiente: {next.snapshot.name} <ChevronRightIcon />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--block btn--xl"
            onClick={() => setDialog('finish')}
            disabled={loading}
          >
            <CheckIcon /> Terminar entrenamiento
          </button>
        )}

        <div className="danger-zone">
          <button
            type="button"
            className="btn btn--ghost btn--block"
            style={{ color: 'var(--danger)' }}
            onClick={() => {
              setDiscardConfirmed(false);
              setDialog('discard');
            }}
          >
            Descartar entrenamiento
          </button>
        </div>
      </main>

      <WriteErrorToast />
      <Dialog
        open={dialog === 'finish'}
        title={totalSets === 0 ? 'No hay series registradas' : '¿Finalizar entrenamiento?'}
        onClose={() => setDialog(null)}
        actions={
          totalSets === 0 ? (
            <button
              type="button"
              className="btn btn--primary"
              data-autofocus
              onClick={() => setDialog(null)}
            >
              Seguir entrenando
            </button>
          ) : (
            <>
              <button type="button" className="btn" onClick={() => setDialog(null)}>
                Seguir entrenando
              </button>
              <button type="button" className="btn btn--primary" onClick={handleFinish}>
                Finalizar y guardar
              </button>
            </>
          )
        }
      >
        {totalSets === 0 ? (
          <p className="muted">
            Registra al menos una serie para guardar el entrenamiento. Si no vas a entrenar, puedes
            descartarlo desde el final de la pantalla.
          </p>
        ) : (
          <p className="muted">
            {totalSets} {totalSets === 1 ? 'serie' : 'series'} en {doneExercises}{' '}
            {doneExercises === 1 ? 'ejercicio' : 'ejercicios'}.
            {skipped > 0 && ` ${skipped} sin series (quedarán como no realizados).`} Después de
            finalizar, el entrenamiento queda guardado en tu historial y ya no se puede editar.
          </p>
        )}
      </Dialog>

      <Dialog
        open={dialog === 'discard'}
        title="¿Descartar este entrenamiento?"
        onClose={() => setDialog(null)}
        actions={
          <>
            <button type="button" className="btn" data-autofocus onClick={() => setDialog(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--danger"
              disabled={totalSets > 0 && !discardConfirmed}
              onClick={handleDiscard}
            >
              Descartar definitivamente
            </button>
          </>
        }
      >
        <p className="muted">
          El entrenamiento no se guardará en tu historial
          {totalSets > 0 && ` y se borrarán ${totalSets} ${totalSets === 1 ? 'serie' : 'series'}`}.
          Esta acción no se puede deshacer.
        </p>
        {totalSets > 0 && (
          <label className="check">
            <input
              type="checkbox"
              checked={discardConfirmed}
              onChange={(e) => setDiscardConfirmed(e.target.checked)}
            />
            <span>Entiendo que se borrarán las series registradas.</span>
          </label>
        )}
      </Dialog>
    </div>
  );
}
