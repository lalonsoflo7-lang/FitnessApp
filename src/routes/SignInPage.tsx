import { useState, type FormEvent } from 'react';
import {
  describeAuthError,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../auth/authActions';
import { APP_NAME } from '../config/constants';
import { useAuth } from '../auth/useAuth';

export function SignInPage() {
  const { redirectError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [localError, setError] = useState<string | null>(null);
  const error = localError ?? redirectError;
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(describeAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(() =>
      mode === 'signin' ? signInWithEmail(email, password) : signUpWithEmail(email, password),
    );
  }

  return (
    <main className="page page--bare" style={{ justifyContent: 'center' }}>
      <div className="stack">
        <img src="/favicon.svg" alt="" width={64} height={64} />
        <h1>{APP_NAME}</h1>
        <p className="muted">Tu diario de entrenamiento para medir la sobrecarga progresiva.</p>
      </div>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary btn--xl btn--block"
        disabled={busy}
        onClick={() => void run(signInWithGoogle)}
      >
        Continuar con Google
      </button>

      {!showEmail ? (
        <button type="button" className="btn btn--ghost" onClick={() => setShowEmail(true)}>
          Usar correo y contraseña
        </button>
      ) : (
        <form className="card stack" onSubmit={onSubmit} aria-label="Acceso con email">
          <div className="segmented" role="group" aria-label="Modo">
            <button
              type="button"
              aria-pressed={mode === 'signin'}
              onClick={() => setMode('signin')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              aria-pressed={mode === 'signup'}
              onClick={() => setMode('signup')}
            >
              Crear cuenta
            </button>
          </div>
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {mode === 'signin' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>
      )}
    </main>
  );
}
