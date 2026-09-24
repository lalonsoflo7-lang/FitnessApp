import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotProps,
} from 'recharts';
import type { ProgressPoint } from '../../analytics/exerciseProgress';
import { formatDate, formatNumber, formatShortDate } from '../../lib/format';
import { CHART_METRICS, type ChartMetric } from './chartMetrics';

// Chart ink follows the design tokens; the single series uses the accent hue.
const INK = {
  line: '#4be3a3',
  pr: '#ffc95c',
  surface: '#161a21',
  grid: '#262c36',
  axis: '#7b8595',
};

interface Datum {
  t: number;
  value: number;
  pr: boolean;
}

function PrAwareDot(props: DotProps & { payload?: Datum }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  // PR sessions get a larger ringed marker (shape + size, not only color).
  return payload?.pr ? (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={INK.pr} stroke={INK.surface} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2.5} fill={INK.surface} />
    </g>
  ) : (
    <circle cx={cx} cy={cy} r={4} fill={INK.line} stroke={INK.surface} strokeWidth={2} />
  );
}

export default function ProgressChart({
  points,
  metric,
}: {
  points: readonly ProgressPoint[];
  metric: ChartMetric;
}) {
  const meta = CHART_METRICS.find((m) => m.id === metric)!;
  const data: Datum[] = points
    .filter((p) => p[metric] !== null)
    .map((p) => ({ t: p.date.getTime(), value: p[metric] as number, pr: p.prs.length > 0 }));

  if (data.length < 2) {
    return (
      <p className="small muted" style={{ padding: '24px 0' }}>
        {data.length === 0
          ? 'Sin datos para esta métrica.'
          : 'Necesitas al menos dos sesiones para ver la evolución.'}
      </p>
    );
  }

  return (
    <figure style={{ margin: 0 }}>
      <figcaption className="visually-hidden">{meta.title}</figcaption>
      <div style={{ width: '100%', height: 220 }} aria-hidden="true">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={INK.grid} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(t: number) => formatShortDate(new Date(t))}
              tick={{ fill: INK.axis, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: INK.grid }}
              minTickGap={24}
            />
            <YAxis
              width={44}
              tick={{ fill: INK.axis, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip
              cursor={{ stroke: INK.axis, strokeDasharray: '3 3' }}
              contentStyle={{
                background: '#1e232c',
                border: '1px solid #2d3440',
                borderRadius: 10,
                color: '#eef1f5',
              }}
              labelStyle={{ color: '#a3adbb' }}
              labelFormatter={(t) => formatDate(new Date(Number(t)))}
              formatter={(v, _name, item) => [
                `${formatNumber(Number(v))} ${meta.unit}${(item.payload as Datum).pr ? ' · PR' : ''}`,
                meta.label,
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={INK.line}
              strokeWidth={2}
              dot={<PrAwareDot />}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
