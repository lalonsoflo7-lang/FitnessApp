import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebase } from '../firebase/firebase';
import { consumeRedirectResult, describeAuthError } from './authActions';
import { AuthContext, type AuthState } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    initializing: true,
    redirectError: null,
  });

  useEffect(() => {
    const { auth } = getFirebase();
    // Surfaces errors of a Google redirect sign-in (the success case arrives via the listener).
    consumeRedirectResult().catch((error: unknown) =>
      setState((s) => ({ ...s, redirectError: describeAuthError(error) })),
    );
    return onAuthStateChanged(auth, (user) =>
      setState((s) => ({ ...s, user, initializing: false })),
    );
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
