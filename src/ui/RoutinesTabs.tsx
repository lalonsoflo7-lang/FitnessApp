import { NavLink } from 'react-router';

export function RoutinesTabs() {
  return (
    <nav className="segmented" aria-label="Secciones de rutinas">
      <NavLink to="/rutinas" end className="segmented__link">
        Rutinas
      </NavLink>
      <NavLink to="/rutinas/ejercicios" className="segmented__link">
        Ejercicios
      </NavLink>
    </nav>
  );
}
