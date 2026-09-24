import type { SetDelta } from '../../analytics/compare';
import type { PersonalRecord, SetType } from '../../domain/types';
import { SET_TYPE_LABELS } from '../../domain/types';
import { DEFAULT_WEIGHT_UNIT } from '../../config/constants';
import { formatRepsDelta, formatSigned, shortPR } from '../../lib/format';
import { StarIcon } from '../../ui/icons';

export function SetTypeBadge({ type }: { type: SetType }) {
  if (type === 'working') return null;
  return <span className={`badge badge--${type}`}>{SET_TYPE_LABELS[type]}</span>;
}

/** "+2.5 kg" / "+1 rep" / "= última" vs. the same effective set of the previous session. */
export function DeltaBadge({ delta }: { delta: SetDelta }) {
  if (delta.weightDelta !== 0) {
    const up = delta.weightDelta > 0;
    return (
      <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
        {up ? '▲' : '▼'} {formatSigned(delta.weightDelta, ` ${DEFAULT_WEIGHT_UNIT}`)}
      </span>
    );
  }
  if (delta.repsDelta !== 0) {
    const up = delta.repsDelta > 0;
    return (
      <span className={`badge ${up ? 'badge--up' : 'badge--down'}`}>
        {up ? '▲' : '▼'} {formatRepsDelta(delta.repsDelta)}
      </span>
    );
  }
  return <span className="badge">= última</span>;
}

export function PrBadge({ prs }: { prs: PersonalRecord[] }) {
  if (prs.length === 0) return null;
  // Show the most meaningful record first: weight > reps > e1RM > volume.
  const order = ['weight', 'reps', 'e1rm', 'volume'];
  const top = [...prs].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))[0]!;
  return (
    <span className="badge badge--pr">
      <StarIcon width={12} height={12} /> {shortPR(top)}
    </span>
  );
}
