import { useId, useMemo, useState } from 'react';
import type { Exercise } from '../domain/types';
import { findExerciseByName, sortExercisesByName } from '../domain/routineOps';
import { normalizeName, validateName } from '../domain/validation';
import { PlusIcon } from './icons';

interface Props {
  exercises: readonly Exercise[];
  /** Ids already in the routine; shown as added. */
  selectedIds: readonly string[];
  onPick: (exerciseId: string) => void;
  /** Creates a new exercise and returns its id. */
  onCreate: (name: string) => string;
}

/** Search box that doubles as "create exercise" when nothing matches. */
export function ExercisePicker({ exercises, selectedIds, onPick, onCreate }: Props) {
  const inputId = useId();
  const [term, setTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const key = normalizeName(term);
    return sortExercisesByName(exercises.filter((e) => !e.archived)).filter(
      (e) => key === '' || normalizeName(e.name).includes(key),
    );
  }, [exercises, term]);

  const exact = findExerciseByName(exercises, term);
  const canCreate = term.trim() !== '' && !exact;

  function create() {
    const result = validateName(term, 'El nombre del ejercicio');
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const id = onCreate(result.value);
    onPick(id);
    setTerm('');
    setError(null);
  }

  return (
    <div className="stack stack--s">
      <label htmlFor={inputId} className="section-title">
        Agregar ejercicio
      </label>
      <input
        id={inputId}
        className="input"
        type="search"
        placeholder="Buscar o crear ejercicio"
        autoComplete="off"
        enterKeyHint="done"
        value={term}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          setTerm(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (canCreate) create();
          else if (exact && !exact.archived) {
            onPick(exact.id);
            setTerm('');
          }
        }}
      />
      {error && <p className="error-text">{error}</p>}
      {canCreate && (
        <button type="button" className="btn btn--primary btn--block" onClick={create}>
          <PlusIcon /> Crear “{term.trim()}”
        </button>
      )}
      {exact?.archived && (
        <p className="small muted">
          “{exact.name}” está archivado. Restáuralo en la pestaña Ejercicios para usarlo.
        </p>
      )}
      <ul className="list" aria-label="Ejercicios disponibles">
        {visible.map((e) => {
          const added = selectedIds.includes(e.id);
          return (
            <li key={e.id}>
              <button
                type="button"
                className="list-item btn--block"
                style={{ cursor: added ? 'default' : 'pointer', textAlign: 'left' }}
                disabled={added}
                onClick={() => onPick(e.id)}
                aria-label={added ? `${e.name} (ya en la rutina)` : `Agregar ${e.name}`}
              >
                <span className="grow">{e.name}</span>
                {added ? (
                  <span className="badge">En la rutina</span>
                ) : (
                  <PlusIcon width={20} height={20} />
                )}
              </button>
            </li>
          );
        })}
        {visible.length === 0 && !canCreate && (
          <li className="empty">Todavía no tienes ejercicios. Escribe un nombre para crearlo.</li>
        )}
      </ul>
    </div>
  );
}
