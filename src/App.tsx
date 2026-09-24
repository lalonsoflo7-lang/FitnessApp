import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { BottomNav } from './ui/BottomNav';
import { FullScreenLoading } from './ui/Loading';
import { SignInPage } from './routes/SignInPage';
import { HomePage } from './routes/HomePage';

// Secondary screens are split so the first paint (Inicio / entrenamiento) stays light.
// Progress screens pull in the charting library only when visited.
const RoutinesPage = lazy(() => import('./routes/RoutinesPage'));
const HistoryPage = lazy(() => import('./routes/HistoryPage'));
const ProgressPage = lazy(() => import('./routes/ProgressPage'));

function AppShell() {
  return (
    <div className="shell">
      <Suspense fallback={<FullScreenLoading />}>
        <Outlet />
      </Suspense>
      <BottomNav />
    </div>
  );
}

function AuthGate() {
  const { user, initializing } = useAuth();
  if (initializing) return <FullScreenLoading label="Abriendo FitnessApp…" />;
  if (!user) return <SignInPage />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="rutinas" element={<RoutinesPage />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route path="progreso" element={<ProgressPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}
