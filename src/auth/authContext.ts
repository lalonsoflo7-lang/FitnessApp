import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  /** True until Firebase restores (or rules out) a persisted session. */
  initializing: boolean;
}

export const AuthContext = createContext<AuthState>({ user: null, initializing: true });
