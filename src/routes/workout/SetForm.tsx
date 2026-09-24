import { useId, useState } from 'react';
import { REPS_STEP, WEIGHT_STEP, DEFAULT_WEIGHT_UNIT } from '../../config/constants';
import { SET_TYPES, SET_TYPE_SHORT_LABELS, type SetType } from '../../domain/types';
import { RIR_MAX, RIR_MIN, parseReps, parseWeight, roundTo } from '../../domain/validation';
import type { SetDraft } from '../../domain/workoutOps';
import type { SetValues } from '../../data/workoutsRepo';
import { MinusIcon, PlusIcon } from '../../ui/icons';

const RIR_OPTIONS = Array.from({ length: RIR_MAX - RIR_MIN + 1 }, (_, i) => RIR_MIN + i);

interface Props {
  initial: SetDraft;
  submitLabel: string;
  onSubmit: (values: SetValues) => void;
  /** Called on every change so the draft can be persisted (survives app restarts). */
  onDraftChange?: (draft: SetDraft) => void;
  secondaryActions?: React.ReactNode;
  idPrefix?: string;
}

function step(value: string, delta: number, decimals: number): string {
  const current = Number(value.replace(',', '.'));
  const base = Number.isFinite(current) ? current : 0;
  return String(roundTo(Math.max(0, base + delta), decimals));
}

/** Weight / reps / type / RIR editor. Shared by "+ Serie" and by editing a logged set. */
export function SetForm({
  initial,
  submitLabel,
  onSubmit,
  onDraftChange,
  secondaryActions,
}: Props) {
  const uid = useId();
  const [draft, setDraft] = useState<SetDraft>(initial);
  const [errors, setErrors] = useState<{ weight?: string; reps?: string }>({});

  function update(patch: Partial<SetDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setErrors({});
    onDraftChange?.(next);
  }

  function submit() {
    const weight = parseWeight(draft.weight);
    const reps = parseReps(draft.reps);
    if (!weight.ok || !reps.ok) {
      setErrors({
        weight: weight.ok ? undefined : weight.error,
        reps: reps.ok ? undefined : reps.error,
      });
      return;
    }
    onSubmit({ weight: weight.value, reps: reps.value, setType: draft.setType, rir: draft.rir });
  }

  const weightId = `${uid}-weight`;
  const repsId = `${uid}-reps`;

  return (
    <form
      className="set-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="set-form__numbers">
        <div className="stepper">
          <label htmlFor={weightId} className="stepper__label">
            Peso ({DEFAULT_WEIGHT_UNIT})
          </label>
          <div className="stepper__row">
            <button
              type="button"
              className="btn btn--icon stepper__btn"
              aria-label={`Restar ${WEIGHT_STEP} ${DEFAULT_WEIGHT_UNIT}`}
              onClick={() => update({ weight: step(draft.weight, -WEIGHT_STEP, 2) })}
            >
              <MinusIcon />
            </button>
            <input
              id={weightId}
              className="stepper__input num"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="next"
              placeholder="0"
              value={draft.weight}
              aria-invalid={errors.weight ? true : undefined}
              aria-describedby={errors.weight ? `${weightId}-err` : undefined}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => update({ weight: e.target.value })}
            />
            <button
              type="button"
              className="btn btn--icon stepper__btn"
              aria-label={`Sumar ${WEIGHT_STEP} ${DEFAULT_WEIGHT_UNIT}`}
              onClick={() => update({ weight: step(draft.weight, WEIGHT_STEP, 2) })}
            >
              <PlusIcon />
            </button>
          </div>
          {errors.weight && (
            <p id={`${weightId}-err`} className="error-text" role="alert">
              {errors.weight}
            </p>
          )}
        </div>
        <div className="stepper">
          <label htmlFor={repsId} className="stepper__label">
            Reps
          </label>
          <div className="stepper__row">
            <button
              type="button"
              className="btn btn--icon stepper__btn"
              aria-label="Restar una repetición"
              onClick={() => update({ reps: step(draft.reps, -REPS_STEP, 0) })}
            >
              <MinusIcon />
            </button>
            <input
              id={repsId}
              className="stepper__input num"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="0"
              value={draft.reps}
              aria-invalid={errors.reps ? true : undefined}
              aria-describedby={errors.reps ? `${repsId}-err` : undefined}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => update({ reps: e.target.value })}
            />
            <button
              type="button"
              className="btn btn--icon stepper__btn"
              aria-label="Sumar una repetición"
              onClick={() => update({ reps: step(draft.reps, REPS_STEP, 0) })}
            >
              <PlusIcon />
            </button>
          </div>
          {errors.reps && (
            <p id={`${repsId}-err`} className="error-text" role="alert">
              {errors.reps}
            </p>
          )}
        </div>
      </div>

      <div className="segmented" role="group" aria-label="Tipo de serie">
        {SET_TYPES.map((type: SetType) => (
          <button
            key={type}
            type="button"
            aria-pressed={draft.setType === type}
            onClick={() => update({ setType: type })}
          >
            {SET_TYPE_SHORT_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="rir" role="group" aria-label="RIR (opcional)">
        <span className="rir__label" aria-hidden="true">
          RIR
        </span>
        <button
          type="button"
          className="rir__opt"
          aria-pressed={draft.rir === null}
          aria-label="Sin RIR"
          onClick={() => update({ rir: null })}
        >
          —
        </button>
        {RIR_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            className="rir__opt num"
            aria-pressed={draft.rir === value}
            aria-label={`RIR ${value}`}
            onClick={() => update({ rir: draft.rir === value ? null : value })}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="set-form__actions">
        {secondaryActions}
        <button type="submit" className="btn btn--primary btn--xl grow">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
