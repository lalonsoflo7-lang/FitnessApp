import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import {
  SET_TYPES,
  type Exercise,
  type ExerciseSnapshot,
  type Routine,
  type SetType,
  type WorkoutSession,
  type WorkoutSet,
  type WorkoutSummary,
} from '../domain/types';
import { finiteOrNull } from '../domain/validation';

export function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(0);
}

function toDateOrNull(value: unknown): Date | null {
  return value == null ? null : toDate(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function exerciseFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Exercise {
  const d = snap.data();
  return {
    id: snap.id,
    name: str(d.name, 'Ejercicio'),
    notes: typeof d.notes === 'string' ? d.notes : null,
    archived: d.archived === true,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function routineFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Routine {
  const d = snap.data();
  return {
    id: snap.id,
    name: str(d.name, 'Rutina'),
    exerciseIds: Array.isArray(d.exerciseIds)
      ? d.exerciseIds.filter((x: unknown): x is string => typeof x === 'string')
      : [],
    archived: d.archived === true,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

function snapshotFromData(value: unknown, index: number): ExerciseSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.exerciseId !== 'string') return null;
  return {
    exerciseId: v.exerciseId,
    name: str(v.name, 'Ejercicio'),
    order: finiteOrNull(v.order) ?? index,
  };
}

export function workoutFromDoc(snap: QueryDocumentSnapshot<DocumentData>): WorkoutSession {
  const d = snap.data();
  const exercises = (Array.isArray(d.exercises) ? d.exercises : [])
    .map(snapshotFromData)
    .filter((x: ExerciseSnapshot | null): x is ExerciseSnapshot => x !== null)
    .sort((a: ExerciseSnapshot, b: ExerciseSnapshot) => a.order - b.order);
  return {
    id: snap.id,
    sourceRoutineId: typeof d.sourceRoutineId === 'string' ? d.sourceRoutineId : null,
    routineNameSnapshot: str(d.routineNameSnapshot, 'Entrenamiento'),
    startedAt: toDate(d.startedAt),
    finishedAt: toDateOrNull(d.finishedAt),
    status: d.status === 'completed' ? 'completed' : 'active',
    exercises,
    summary: d.summary && typeof d.summary === 'object' ? (d.summary as WorkoutSummary) : null,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function setFromDoc(snap: QueryDocumentSnapshot<DocumentData>): WorkoutSet {
  const d = snap.data();
  const setType: SetType = (SET_TYPES as readonly string[]).includes(d.setType)
    ? (d.setType as SetType)
    : 'working';
  return {
    id: snap.id,
    workoutId: str(d.workoutId),
    exerciseId: str(d.exerciseId),
    exerciseNameSnapshot: str(d.exerciseNameSnapshot, 'Ejercicio'),
    exerciseOrder: finiteOrNull(d.exerciseOrder) ?? 0,
    setNumber: finiteOrNull(d.setNumber) ?? 0,
    weight: Math.max(0, finiteOrNull(d.weight) ?? 0),
    reps: Math.max(0, finiteOrNull(d.reps) ?? 0),
    setType,
    rir: finiteOrNull(d.rir),
    workoutStartedAt: toDate(d.workoutStartedAt),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}
