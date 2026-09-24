import { DEFAULT_WEIGHT_UNIT, LOCALE, TIMEZONE } from '../config/constants';
import type { PersonalRecord } from '../domain/types';

const num = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const num1 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const int = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return Number.isFinite(value) ? num.format(value) : '—';
}

export function formatWeight(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value)
    ? '—'
    : `${num.format(value)} ${DEFAULT_WEIGHT_UNIT}`;
}

export function formatE1rm(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value)
    ? '—'
    : `${num1.format(value)} ${DEFAULT_WEIGHT_UNIT}`;
}

export function formatVolume(value: number): string {
  return Number.isFinite(value) ? `${int.format(value)} ${DEFAULT_WEIGHT_UNIT}` : '—';
}

export function formatSet(weight: number, reps: number): string {
  return `${formatWeight(weight)} × ${reps}`;
}

export function formatSigned(value: number, unit = '', formatter = num): string {
  const abs = formatter.format(Math.abs(value));
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${abs}${unit}`;
}

export function formatRepsDelta(delta: number): string {
  const n = Math.abs(delta);
  return `${formatSigned(delta)} ${n === 1 ? 'rep' : 'reps'}`;
}

export function formatDate(date: Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...opts,
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** 3725 → "1 h 02 min"; 540 → "9 min". */
export function formatDuration(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '—';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
  return `${m} min`;
}

/** Stopwatch style: 1:02:05 or 12:05. */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function describePR(pr: PersonalRecord): string {
  switch (pr.kind) {
    case 'weight':
      return `Nuevo peso máximo: ${formatWeight(pr.value)}`;
    case 'reps':
      return `Nueva marca de repeticiones con ${formatWeight(pr.weight)}: ${pr.value}`;
    case 'e1rm':
      return `Nuevo mejor 1RM estimado: ${formatE1rm(pr.value)}`;
    case 'volume':
      return `Nuevo volumen máximo: ${formatVolume(pr.value)}`;
  }
}

export function shortPR(pr: PersonalRecord): string {
  switch (pr.kind) {
    case 'weight':
      return 'PR peso';
    case 'reps':
      return `PR reps · ${formatWeight(pr.weight)}`;
    case 'e1rm':
      return 'PR 1RM est.';
    case 'volume':
      return 'PR volumen';
  }
}
