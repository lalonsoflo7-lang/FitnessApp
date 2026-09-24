import { useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useExercisesById, useData } from '../data/useData';
import { startWorkout } from '../data/workoutsRepo';
import type { Routine } from '../domain/types';
import { buildExerciseSnapshots } from '../domain/workoutOps';
import { useActiveWorkout } from '../hooks/useWorkouts';
import { PlayIcon } from './icons';

export function StartWorkoutButton({ routine }: { routine: Routine }) {
  const { uid } = useData();
  const exercisesById = useExercisesById();
  const active = useActiveWorkout();
  const navigate = useNavigate();
  const starting = useRef(false);

  if (active) {
    return (
      <Link to={`/entrenamiento/${active.id}`} className="btn btn--block">
        {active.sourceRoutineId === routine.id
          ? 'Continuar entrenamiento'
          : 'Tienes otro entrenamiento en curso'}
      </Link>
    );
  }

  const snapshots = buildExerciseSnapshots(routine, exercisesById);
  if (snapshots.length === 0) {
    return <p className="small muted">Agrega ejercicios para poder iniciar esta rutina.</p>;
  }

  return (
    <button
      type="button"
      className="btn btn--primary btn--block"
      aria-label={`Iniciar entrenamiento ${routine.name}`}
      onClick={() => {
        // Double-tap guard: never create two workouts from one gesture.
        if (starting.current) return;
        starting.current = true;
        const id = startWorkout(uid, routine, snapshots);
        navigate(`/entrenamiento/${id}`);
      }}
    >
      <PlayIcon /> Iniciar entrenamiento
    </button>
  );
}
