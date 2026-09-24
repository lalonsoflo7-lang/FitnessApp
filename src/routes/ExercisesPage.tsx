import { useState } from 'react';
import { Link } from 'react-router';
import { useData } from '../data/useData';
import { createExercise, updateExercise } from '../data/exercisesRepo';
import type { Exercise } from '../domain/types';
import { findExerciseByName, sortExercisesByName } from '../domain/routineOps';
import { validateName } from '../domain/validation';
import { PageHeader } from '../ui/PageHeader';
import { RoutinesTabs } from '../ui/RoutinesTabs';
import { InlineLoading } from '../ui/Loading';
import { CheckIcon, CloseIcon, EditIcon } from '../ui/icons';

function ExerciseRow({ exercise, all }: { exercise: Exercise; all: readonly Exercise[] }) {
  const { uid } = useData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(exercise.name);
  const [error, setError] = useState<string | null>(null);

  function save() {
    const result = validateName(draft, 'El nombre');
    if (!result.ok) return setError(result.error);
    const clash = findExerciseByName(all, result.value);
    if (clash && clash.id !== exercise.id) return setError('Ya existe un ejercicio con ese nombre');
    updateExercise(uid, exercise.id, { name: result.value });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="card card--tight stack stack--s">
        <label className="visually-hidden" htmlFor={`rename-${exercise.id}`}>
          Nuevo nombre para {exercise.name}
        </label>
        <div className="row">
          <input
            id={`rename-${exercise.id}`}
            className="input grow"
            value={draft}
            autoFocus
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <button
            type="button"
            className="btn btn--primary btn--icon"
            onClick={save}
            aria-label="Guardar nombre"
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            className="btn btn--icon"
            aria-label="Cancelar"
            onClick={() => {
              setEditing(false);
              setDraft(exercise.name);
              setError(null);
            }}
          >
            <CloseIcon />
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
        <p className="small faint">
          Los entrenamientos pasados conservan el nombre con el que se registraron.
        </p>
      </li>
    );
  }

  return (
    <li className="list-item" style={{ paddingRight: 4 }}>
      <Link to={`/progreso/${exercise.id}`} className="grow" style={{ color: 'inherit' }}>
        {exercise.name}
      </Link>
      <button
        type="button"
        className="btn btn--ghost btn--icon"
        aria-label={`Renombrar ${exercise.name}`}
        onClick={() => setEditing(true)}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="btn btn--ghost small"
        onClick={() => updateExercise(uid, exercise.id, { archived: !exercise.archived })}
        aria-label={`${exercise.archived ? 'Restaurar' : 'Archivar'} ${exercise.name}`}
      >
        {exercise.archived ? 'Restaurar' : 'Archivar'}
      </button>
    </li>
  );
}

export default function ExercisesPage() {
  const { uid, exercises } = useData();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sorted = sortExercisesByName(exercises.data);
  const active = sorted.filter((e) => !e.archived);
  const archived = sorted.filter((e) => e.archived);

  function add() {
    const result = validateName(name, 'El nombre');
    if (!result.ok) return setError(result.error);
    if (findExerciseByName(exercises.data, result.value)) {
      return setError('Ya existe un ejercicio con ese nombre');
    }
    createExercise(uid, result.value);
    setName('');
    setError(null);
  }

  return (
    <main className="page">
      <PageHeader title="Ejercicios" />
      <RoutinesTabs />
      <form
        className="stack stack--s"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label htmlFor="new-exercise" className="section-title">
          Nuevo ejercicio
        </label>
        <div className="row">
          <input
            id="new-exercise"
            className="input grow"
            placeholder="Ej. Press banca"
            autoComplete="off"
            enterKeyHint="done"
            value={name}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
          <button type="submit" className="btn btn--primary">
            Crear
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      {exercises.loading && <InlineLoading />}
      {!exercises.loading && active.length === 0 && (
        <p className="empty">Crea tus ejercicios aquí o directamente al editar una rutina.</p>
      )}
      <ul className="list" aria-label="Ejercicios">
        {active.map((e) => (
          <ExerciseRow key={e.id} exercise={e} all={exercises.data} />
        ))}
      </ul>
      {archived.length > 0 && (
        <section className="stack stack--s">
          <h2 className="section-title">Archivados</h2>
          <ul className="list" aria-label="Ejercicios archivados">
            {archived.map((e) => (
              <ExerciseRow key={e.id} exercise={e} all={exercises.data} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
