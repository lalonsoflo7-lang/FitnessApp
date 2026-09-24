import { useContext, useMemo } from 'react';
import { DataContext } from './dataContext';
import type { Exercise } from '../domain/types';

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData() debe usarse dentro de <DataProvider>');
  return ctx;
}

export function useExercisesById(): Map<string, Exercise> {
  const { exercises } = useData();
  return useMemo(() => new Map(exercises.data.map((e) => [e.id, e])), [exercises.data]);
}
