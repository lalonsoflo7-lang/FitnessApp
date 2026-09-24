export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 1000;
export const REPS_MIN = 0;
export const REPS_MAX = 999;
export const RIR_MIN = 0;
export const RIR_MAX = 5;
export const NAME_MAX_LENGTH = 80;
export const NOTES_MAX_LENGTH = 500;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Accepts "82.5" and "82,5" (Spanish keyboards). Rejects negatives, NaN and Infinity. */
export function parseWeight(input: string | number): ParseResult<number> {
  const raw = typeof input === 'number' ? String(input) : input.trim().replace(',', '.');
  if (raw === '') return { ok: false, error: 'Escribe el peso' };
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(raw)) {
    return { ok: false, error: 'El peso debe ser un número mayor o igual a 0' };
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < WEIGHT_MIN) {
    return { ok: false, error: 'El peso debe ser un número mayor o igual a 0' };
  }
  if (value > WEIGHT_MAX) return { ok: false, error: `El peso máximo es ${WEIGHT_MAX} kg` };
  return { ok: true, value: roundTo(value, 2) };
}

export function parseReps(input: string | number): ParseResult<number> {
  const raw = typeof input === 'number' ? String(input) : input.trim();
  if (raw === '') return { ok: false, error: 'Escribe las repeticiones' };
  if (!/^\d+$/.test(raw)) {
    return { ok: false, error: 'Las repeticiones deben ser un número entero ≥ 0' };
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < REPS_MIN) {
    return { ok: false, error: 'Las repeticiones deben ser un número entero ≥ 0' };
  }
  if (value > REPS_MAX) return { ok: false, error: `Máximo ${REPS_MAX} repeticiones` };
  return { ok: true, value };
}

export function isValidRir(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === 'number' && Number.isInteger(value) && value >= RIR_MIN && value <= RIR_MAX)
  );
}

export function validateName(input: string, what = 'El nombre'): ParseResult<string> {
  const value = input.trim().replace(/\s+/g, ' ');
  if (value === '') return { ok: false, error: `${what} no puede estar vacío` };
  if (value.length > NAME_MAX_LENGTH) {
    return { ok: false, error: `${what} admite como máximo ${NAME_MAX_LENGTH} caracteres` };
  }
  return { ok: true, value };
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Returns a finite number or null. Protects calculations from corrupt/incomplete data. */
export function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}
