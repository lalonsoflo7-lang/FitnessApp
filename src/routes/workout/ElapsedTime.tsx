import { useEffect, useState } from 'react';
import { formatClock } from '../../lib/format';

/** Isolated ticking clock so the rest of the workout screen doesn't re-render every second. */
export function ElapsedTime({ since }: { since: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const seconds = (now - since.getTime()) / 1000;
  return (
    <span className="clock num" aria-label="Tiempo transcurrido">
      <time dateTime={`PT${Math.floor(Math.max(0, seconds))}S`}>{formatClock(seconds)}</time>
    </span>
  );
}
