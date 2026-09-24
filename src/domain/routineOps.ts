import type { Exercise } from './types';
import { normalizeName } from './validation';

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) {
    return [...list];
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

export function addUnique(list: readonly string[], id: string): string[] {
  return list.includes(id) ? [...list] : [...list, id];
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/** Finds an existing (non-archived first) exercise by name, ignoring case and accents. */
export function findExerciseByName(exercises: readonly Exercise[], name: string) {
  const key = normalizeName(name);
  if (key === '') return undefined;
  const matches = exercises.filter((e) => normalizeName(e.name) === key);
  return matches.find((e) => !e.archived) ?? matches[0];
}

export function sortExercisesByName(exercises: readonly Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
