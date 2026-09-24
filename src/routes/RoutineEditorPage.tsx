import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useData, useExercisesById } from '../data/useData';
import { createExercise } from '../data/exercisesRepo';
import { createRoutine, deleteRoutine, updateRoutine } from '../data/routinesRepo';
import { addUnique, moveItem, removeAt } from '../domain/routineOps';
import { validateName } from '../domain/validation';
import type { Routine } from '../domain/types';
import { Dialog } from '../ui/Dialog';
import { ExercisePicker } from '../ui/ExercisePicker';
import { PageHeader } from '../ui/PageHeader';
import { FullScreenLoading } from '../ui/Loading';
import { CloseIcon, DownIcon, UpIcon } from '../ui/icons';

export default function RoutineEditorPage() {
  const { routineId } = useParams();
  const { routines } = useData();
  const routine =
    routineId === undefined ? undefined : routines.data.find((r) => r.id === routineId);

  if (routineId !== undefined && !routine) {
    if (routines.loading) return <FullScreenLoading />;
    return (
      <main className="page">
        <PageHeader title="Rutina no encontrada" back="/rutinas" />
      </main>
    );
  }
  // Keyed so the draft is initialised once per routine and not overwritten by live updates.
  return <RoutineEditor key={routine?.id ?? 'new'} routine={routine} />;
}

function RoutineEditor({ routine }: { routine: Routine | undefined }) {
  const isNew = routine === undefined;
  const navigate = useNavigate();
  const { uid, exercises } = useData();
  const exercisesById = useExercisesById();

  const [name, setName] = useState(routine?.name ?? '');
  const [exerciseIds, setExerciseIds] = useState<string[]>(routine?.exerciseIds ?? []);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function save() {
    const result = validateName(name, 'El nombre de la rutina');
    if (!result.ok) {
      setNameError(result.error);
      return;
    }
    if (isNew) createRoutine(uid, result.value, exerciseIds);
    else updateRoutine(uid, routine.id, { name: result.value, exerciseIds });
    navigate('/rutinas');
  }

  return (
    <main className="page">
      <PageHeader title={isNew ? 'Nueva rutina' : 'Editar rutina'} back="/rutinas" />

      <div className="field">
        <label htmlFor="routine-name">Nombre</label>
        <input
          id="routine-name"
          className="input"
          placeholder="Ej. Push, Pierna A…"
          autoComplete="off"
          value={name}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? 'routine-name-error' : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
        />
        {nameError && (
          <p id="routine-name-error" className="error-text">
            {nameError}
          </p>
        )}
      </div>

      <section className="stack stack--s" aria-labelledby="routine-exercises-title">
        <h2 id="routine-exercises-title" className="section-title">
          Ejercicios ({exerciseIds.length})
        </h2>
        {exerciseIds.length === 0 && (
          <p className="empty">Agrega ejercicios desde el buscador de abajo.</p>
        )}
        <ol className="list" aria-label="Orden de ejercicios">
          {exerciseIds.map((id, index) => {
            const exName = exercisesById.get(id)?.name ?? 'Ejercicio';
            return (
              <li key={id} className="list-item" style={{ paddingRight: 4 }}>
                <span className="num faint" style={{ width: 20 }}>
                  {index + 1}
                </span>
                <span className="grow">{exName}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  aria-label={`Subir ${exName}`}
                  disabled={index === 0}
                  onClick={() => setExerciseIds((l) => moveItem(l, index, index - 1))}
                >
                  <UpIcon />
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  aria-label={`Bajar ${exName}`}
                  disabled={index === exerciseIds.length - 1}
                  onClick={() => setExerciseIds((l) => moveItem(l, index, index + 1))}
                >
                  <DownIcon />
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  aria-label={`Quitar ${exName} de la rutina`}
                  onClick={() => setExerciseIds((l) => removeAt(l, index))}
                >
                  <CloseIcon />
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="card">
        <ExercisePicker
          exercises={exercises.data}
          selectedIds={exerciseIds}
          onPick={(id) => setExerciseIds((l) => addUnique(l, id))}
          onCreate={(exName) => createExercise(uid, exName)}
        />
      </div>

      <button type="button" className="btn btn--primary btn--xl btn--block" onClick={save}>
        Guardar rutina
      </button>

      {!isNew && routine && (
        <section className="stack stack--s" style={{ marginTop: 24 }}>
          <p className="small faint">
            Editar la rutina no cambia los entrenamientos que ya hiciste: cada entrenamiento guarda
            su propia copia de los ejercicios.
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              updateRoutine(uid, routine.id, { archived: !routine.archived });
              navigate('/rutinas');
            }}
          >
            {routine.archived ? 'Restaurar rutina' : 'Archivar rutina'}
          </button>
          <button type="button" className="btn btn--danger" onClick={() => setConfirmDelete(true)}>
            Eliminar rutina
          </button>
        </section>
      )}

      <Dialog
        open={confirmDelete}
        title="¿Eliminar esta rutina?"
        onClose={() => setConfirmDelete(false)}
        actions={
          <>
            <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                if (routine) deleteRoutine(uid, routine.id);
                navigate('/rutinas');
              }}
            >
              Eliminar rutina
            </button>
          </>
        }
      >
        <p className="muted">
          La rutina desaparecerá de tu lista. Tu historial de entrenamientos no se modifica.
        </p>
      </Dialog>
    </main>
  );
}
