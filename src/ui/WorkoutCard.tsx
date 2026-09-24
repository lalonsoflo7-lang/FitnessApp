import { Link } from 'react-router';
import type { WorkoutSession } from '../domain/types';
import { formatDate, formatDuration, formatVolume } from '../lib/format';
import { StarIcon } from './icons';

export function WorkoutCard({ workout }: { workout: WorkoutSession }) {
  const s = workout.summary;
  return (
    <li>
      <Link
        to={`/historial/${workout.id}`}
        className="card card--link stack stack--s"
        aria-label={`${workout.routineNameSnapshot}, ${formatDate(workout.startedAt)}`}
      >
        <div className="row row--between">
          <h2 style={{ fontSize: '1.05rem' }}>{workout.routineNameSnapshot}</h2>
          <span className="small muted">{formatDate(workout.startedAt)}</span>
        </div>
        {s && (
          <div className="row row--wrap small muted num" style={{ gap: '4px 14px' }}>
            <span>{formatDuration(s.durationSec)}</span>
            <span>Vol. {formatVolume(s.totalVolume)}</span>
            <span>
              {s.exerciseCount} {s.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
            </span>
            <span>
              {s.totalSets} {s.totalSets === 1 ? 'serie' : 'series'}
            </span>
            {s.prCount > 0 && (
              <span className="badge badge--pr">
                <StarIcon width={12} height={12} /> {s.prCount} PR
              </span>
            )}
          </div>
        )}
      </Link>
    </li>
  );
}
