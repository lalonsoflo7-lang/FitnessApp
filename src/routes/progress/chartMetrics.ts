export type ChartMetric = 'topWeight' | 'bestE1rm' | 'volume' | 'totalReps';

export const CHART_METRICS: { id: ChartMetric; label: string; title: string; unit: string }[] = [
  { id: 'topWeight', label: 'Peso', title: 'Peso máximo por sesión', unit: 'kg' },
  { id: 'bestE1rm', label: '1RM', title: '1RM estimado (Epley) por sesión', unit: 'kg' },
  { id: 'volume', label: 'Volumen', title: 'Volumen por sesión', unit: 'kg' },
  { id: 'totalReps', label: 'Reps', title: 'Repeticiones efectivas por sesión', unit: 'reps' },
];
