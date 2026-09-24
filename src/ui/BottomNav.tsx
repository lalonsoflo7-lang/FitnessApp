import { NavLink } from 'react-router';
import { ChartIcon, HistoryIcon, HomeIcon, ListIcon } from './icons';

const ITEMS = [
  { to: '/', label: 'Inicio', Icon: HomeIcon, end: true },
  { to: '/rutinas', label: 'Rutinas', Icon: ListIcon, end: false },
  { to: '/historial', label: 'Historial', Icon: HistoryIcon, end: false },
  { to: '/progreso', label: 'Progreso', Icon: ChartIcon, end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
