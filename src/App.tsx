import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import { BottomNav } from './ui/BottomNav';
import { WriteErrorToast } from './ui/WriteErrorToast';
import { FullScreenLoading } from './ui/Loading';
import { SignInPage } from './routes/SignInPage';
import { HomePage } from './routes/HomePage';
import { DataProvider } from './data/DataProvider';
// The workout screen is eagerly loaded: it must open instantly, also offline.
import ActiveWorkoutPage from './routes/workout/ActiveWorkoutPage';

// Secondary screens are split so the first paint (Inicio / entrenamiento) stays light.
// Progress screens pull in the charting library only when visited.
const RoutinesPage = lazy(() => import('./routes/RoutinesPage'));
const RoutineEditorPage = lazy(() => import('./routes/RoutineEditorPage'));
const ExercisesPage = lazy(() => import('./routes/ExercisesPage'));
const HistoryPage = lazy(() => import('./routes/HistoryPage'));
const WorkoutDetailPage = lazy(() => import('./routes/WorkoutDetailPage'));
const ProgressPage = lazy(() => import('./routes/ProgressPage'));
const ExerciseDetailPage = lazy(() => import('./routes/progress/ExerciseDetailPage'));

function AppShell() {
  return (
    <div className="shell">
      <Suspense fallback={<FullScreenLoading />}>
        <Outlet />
      </Suspense>
      <BottomNav />
      <WriteErrorToast />
    </div>
  );
}

function AuthGate() {
  const { user, initializing } = useAuth();
  if (initializing) return <FullScreenLoading label="Abriendo FitnessApp…" />;
  if (!user) return <SignInPage />;
  return (
    <DataProvider uid={user.uid}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="rutinas" element={<RoutinesPage />} />
          <Route path="rutinas/ejercicios" element={<ExercisesPage />} />
          <Route path="rutinas/nueva" element={<RoutineEditorPage />} />
          <Route path="rutinas/:routineId" element={<RoutineEditorPage />} />
          <Route path="historial" element={<HistoryPage />} />
          <Route path="historial/:workoutId" element={<WorkoutDetailPage />} />
          <Route path="progreso" element={<ProgressPage />} />
          <Route path="progreso/:exerciseId" element={<ExerciseDetailPage />} />
        </Route>
        <Route path="entrenamiento/:workoutId" element={<ActiveWorkoutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
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
